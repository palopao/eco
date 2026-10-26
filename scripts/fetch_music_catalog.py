#!/usr/bin/env python3
"""Fetch specific artist/country Discogs metadata with tracklists into an SQLite database with rate limiting and suggestions."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import logging
import os
import sqlite3
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import requests
from tqdm import tqdm

# --- CONFIGURAÇÃO ---
DEFAULT_TOKENS_FILE = Path(__file__).parent / "discogs_tokens.txt"
DEFAULT_DB_PATH = Path("music") / "catalog.db"

# Adiciona aqui os artistas/bandas ou países que pretendes recolher
TARGET_ARTISTS: list[str] = [
    # "Xutos & Pontapés",
    "Madredeus",
    # "Rádio Macau",
    # "The Beatles",
]
TARGET_COUNTRIES: list[str] = [
    # "Portugal",  # Descomenta se quiseres pesquisar por país inteiro
]
# --------------------

API_SEARCH_URL = "https://api.discogs.com/database/search"
API_RELEASE_URL = "https://api.discogs.com/releases/"
PAGE_SIZE = 50
MIN_REQUEST_INTERVAL = 1.2  # Margem de segurança por token
MAX_RETRIES = 6
LOGGER = logging.getLogger("eco-music-catalog")


def load_tokens(tokens_file: Path) -> list[str]:
    """Lê os tokens a partir de um ficheiro de texto (um por linha)."""
    if tokens_file.exists():
        lines = tokens_file.read_text(encoding="utf-8").splitlines()
        tokens = [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]
        if tokens:
            return tokens

    env_tokens = os.getenv("DISCOGS_USER_TOKENS", "")
    if env_tokens:
        return [t.strip() for t in env_tokens.split(",") if t.strip()]

    return []


class DiscogsClient:
    def __init__(self, tokens: list[str]) -> None:
        valid_tokens = [t.strip() for t in tokens if t.strip() and "token" not in t]
        if not valid_tokens:
            raise ValueError(
                f"Nenhum token válido encontrado. Adicione os seus tokens ao ficheiro '{DEFAULT_TOKENS_FILE}' (um por linha)."
            )
        self.tokens = valid_tokens
        self.token_index = 0
        self.lock = threading.Lock()
        
        self._token_last_request = {token: 0.0 for token in self.tokens}
        self._token_blocked_until = {token: 0.0 for token in self.tokens}

    def _acquire_token_and_wait(self) -> str:
        while True:
            with self.lock:
                now = time.monotonic()
                available_tokens = [
                    t for t in self.tokens if now >= self._token_blocked_until[t]
                ]
                if not available_tokens:
                    token = min(self.tokens, key=lambda t: self._token_blocked_until[t])
                else:
                    token = available_tokens[self.token_index % len(available_tokens)]
                    self.token_index = (self.token_index + 1) % len(available_tokens)

                elapsed = now - self._token_last_request[token]
                blocked_time = self._token_blocked_until[token] - now

                wait_time = max(0.0, MIN_REQUEST_INTERVAL - elapsed, blocked_time)
                if wait_time == 0.0:
                    self._token_last_request[token] = time.monotonic()
                    return token

            time.sleep(wait_time)

    def mark_token_limited(self, token: str, retry_after: float = 20.0) -> None:
        with self.lock:
            self._token_blocked_until[token] = time.monotonic() + retry_after

    def _make_request(self, url: str, params: dict[str, Any]) -> dict[str, Any]:
        for attempt in range(MAX_RETRIES):
            token = self._acquire_token_and_wait()
            
            session = requests.Session()
            session.trust_env = False
            session.headers.update({
                "User-Agent": "EcoMusicCatalog/1.0",
                "Authorization": f"Discogs token={token}",
                "Accept": "application/json",
            })

            try:
                response = session.get(url, params=params, timeout=(10, 40))
            except requests.RequestException:
                if attempt == MAX_RETRIES - 1:
                    raise
                time.sleep(min(2**attempt, 10))
                continue

            if response.status_code == 429:
                retry_after_hdr = response.headers.get("Retry-After")
                sleep_sec = float(retry_after_hdr) if retry_after_hdr else 20.0
                self.mark_token_limited(token, retry_after=sleep_sec)
                time.sleep(min(sleep_sec, 5.0))
                continue

            response.raise_for_status()
            return response.json()

        raise RuntimeError(f"Falha no pedido ao Discogs para o URL: {url}")

    def search_artist_suggestions(self, artist_name: str) -> list[str]:
        """Procura artistas no Discogs e retorna nomes semelhantes se não houver exato."""
        data = self._make_request(API_SEARCH_URL, {"q": artist_name, "type": "artist", "per_page": 5})
        results = data.get("results", [])
        return [item.get("title") for item in results if item.get("title")]

    def get_release_details(self, release_id: int) -> dict[str, Any] | None:
        """Obtém detalhes completos de um lançamento, incluindo tracklist e data exata."""
        try:
            data = self._make_request(f"{API_RELEASE_URL}{release_id}", {})
            
            # Extrair lista de faixas (nomes das músicas)
            tracks = []
            for track in data.get("tracklist", []):
                if track.get("type_") == "heading":
                    continue  # Ignorar cabeçalhos de vinil (ex: "Side A")
                title = track.get("title")
                if title:
                    tracks.append(title.strip())

            # Data de lançamento
            released = data.get("released", "")
            year = data.get("year")
            
            if not year and released:
                # Tentar extrair o ano da string de data do Discogs
                import re
                match = re.search(r"\b(18|19|20)\d{2}\b", released)
                if match:
                    year = int(match.group(0))

            return {
                "releaseDate": released if released else (f"{year}-01-01" if year else "Unknown"),
                "year": year if year else 0,
                "tracks": tracks,
            }
        except Exception as e:
            LOGGER.warning("Erro ao obter detalhes do lançamento %s: %s", release_id, e)
            return None

    def fetch_releases_by_query(self, params: dict[str, Any], on_release_fetched: Callable[[int], None] | None = None) -> list[dict[str, Any]]:
        albums_by_id: dict[str, dict[str, Any]] = {}
        page = 1
        total_pages = 1

        while page <= total_pages:
            current_params = params.copy()
            current_params["page"] = page
            current_params["per_page"] = PAGE_SIZE
            current_params["type"] = "release"

            data = self._make_request(API_SEARCH_URL, current_params)
            pagination = data.get("pagination", {})
            total_pages = pagination.get("pages", 1)
            results = data.get("results", [])

            for item in results:
                discogs_id = item.get("id")
                if not discogs_id:
                    continue
                
                str_id = str(discogs_id)
                if str_id in albums_by_id:
                    continue

                title_raw = item.get("title", "")
                if " - " in title_raw:
                    artist, title = title_raw.split(" - ", 1)
                else:
                    artist, title = "Unknown artist", title_raw

                genres = sorted(
                    {
                        g.strip()
                        for g in (item.get("genre", []) + item.get("style", []))
                        if isinstance(g, str) and g.strip()
                    }
                )

                albums_by_id[str_id] = {
                    "musicbrainzId": str_id,
                    "discogs_int_id": discogs_id,
                    "title": title.strip(),
                    "artist": artist.strip(),
                    "coverUrl": item.get("cover_image", ""),
                    "genres": json.dumps(genres, ensure_ascii=False),
                }

            page += 1

        # Enriquecer cada álbum com detalhes (tracklist e data exata)
        detailed_albums = []
        releases_to_fetch = list(albums_by_id.values())

        max_workers = len(self.tokens) * 2
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_album = {
                executor.submit(self.get_release_details, album["discogs_int_id"]): album
                for album in releases_to_fetch
            }
            for future in concurrent.futures.as_completed(future_to_album):
                album = future_to_album[future]
                try:
                    details = future.result()
                    if details:
                        album["releaseDate"] = details["releaseDate"]
                        album["year"] = details["year"]
                        album["tracks"] = json.dumps(details["tracks"], ensure_ascii=False)
                    else:
                        album["releaseDate"] = "Unknown"
                        album["year"] = 0
                        album["tracks"] = json.dumps([], ensure_ascii=False)
                    
                    detailed_albums.append(album)
                    if on_release_fetched:
                        on_release_fetched(1)
                except Exception as e:
                    LOGGER.warning("Erro ao processar lançamento %s: %s", album["title"], e)

        return sorted(detailed_albums, key=lambda item: (item["year"], item["title"].casefold()))


def init_db(db_path: Path) -> None:
    """Inicializa a base de dados SQLite com a tabela e índices necessários."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS albums (
                musicbrainzId TEXT PRIMARY KEY,
                title TEXT,
                artist TEXT,
                releaseDate TEXT,
                year INTEGER,
                coverUrl TEXT,
                genres TEXT,
                tracks TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_albums_year ON albums(year)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist)")
        conn.commit()


def save_albums_to_db(db_path: Path, albums: list[dict[str, Any]]) -> None:
    """Insere ou atualiza os álbuns na base de dados SQLite."""
    with sqlite3.connect(db_path) as conn:
        conn.executemany("""
            INSERT INTO albums (musicbrainzId, title, artist, releaseDate, year, coverUrl, genres, tracks)
            VALUES (:musicbrainzId, :title, :artist, :releaseDate, :year, :coverUrl, :genres, :tracks)
            ON CONFLICT(musicbrainzId) DO UPDATE SET
                title=excluded.title,
                artist=excluded.artist,
                releaseDate=excluded.releaseDate,
                year=excluded.year,
                coverUrl=excluded.coverUrl,
                genres=excluded.genres,
                tracks=excluded.tracks
        """, albums)
        conn.commit()


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db-path",
        type=Path,
        default=DEFAULT_DB_PATH,
        help="Target SQLite database file path (default: music/catalog.db).",
    )
    parser.add_argument(
        "--tokens-file",
        type=Path,
        default=DEFAULT_TOKENS_FILE,
        help="Path to file containing Discogs tokens.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.WARNING, format="%(asctime)s %(levelname)s %(message)s")
    args = parse_args(argv)
    
    tokens = load_tokens(args.tokens_file)
    try:
        client = DiscogsClient(tokens)
    except ValueError as e:
        print(f"Erro: {e}")
        return 2

    init_db(args.db_path)

    print(f"A iniciar recolha direcionada com {len(client.tokens)} token(s)...")

    search_queries = []

    # Processar Artistas
    for artist in TARGET_ARTISTS:
        # Testar se o artista existe diretamente
        test_data = client._make_request(API_SEARCH_URL, {"artist": artist, "type": "release", "per_page": 1})
        if test_data.get("pagination", {}).get("items", 0) > 0:
            search_queries.append({"label": f"Artista: {artist}", "params": {"artist": artist}})
        else:
            print(f"\n[Aviso] Artista exato não encontrado: '{artist}'. A procurar sugestões...")
            suggestions = client.search_artist_suggestions(artist)
            if suggestions:
                print(f"   Sugestões encontradas: {suggestions}")
                # Usar a primeira sugestão válida encontrada
                best_match = suggestions[0]
                print(f"   -> A usar sugestão: '{best_match}'")
                search_queries.append({"label": f"Artista (Sugestão): {best_match}", "params": {"artist": best_match}})
            else:
                print(f"   -> Nenhuma sugestão encontrada para '{artist}'.")

    # Processar Países
    for country in TARGET_COUNTRIES:
        search_queries.append({"label": f"País: {country}", "params": {"country": country}})

    if not search_queries:
        print("\nNenhum termo de pesquisa válido definido em TARGET_ARTISTS ou TARGET_COUNTRIES.")
        return 0

    for query_info in search_queries:
        label = query_info["label"]
        params = query_info["params"]
        
        print(f"\nA pesquisar por [{label}]...")
        try:
            # Pré-calcular total de itens
            preview_data = client._make_request(API_SEARCH_URL, {**params, "type": "release", "per_page": 1})
            total_items = preview_data.get("pagination", {}).get("items", 0)
            
            if total_items == 0:
                print(f" -> Nenhum lançamento encontrado para {label}.")
                continue

            print(f" -> {total_items} lançamentos previstos. A descarregar detalhes e músicas...")

            pbar = tqdm(total=total_items, desc=label, unit="álbum", dynamic_ncols=True)
            
            albums = client.fetch_releases_by_query(params, on_release_fetched=lambda _: pbar.update(1))
            pbar.close()

            if albums:
                save_albums_to_db(args.db_path, albums)
                print(f" ✓ {len(albums)} álbuns gravados com sucesso para {label}.")
        except Exception as e:
            print(f" ✗ Erro ao processar {label}: {e}")

    print(f"\nConcluído com sucesso! Base de dados guardada em '{args.db_path}'.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrompido pelo utilizador.")
        raise SystemExit(130)
    except Exception as error:
        print(f"\nErrorCode: {error}")
        raise SystemExit(1)