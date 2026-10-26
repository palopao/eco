#!/usr/init/env python3
"""Converte o dump de releases do Discogs (.xml.gz) em bases SQLite, uma por ano.

Arquitetura (o custo está no parse do XML, por isso é aí que se paraleliza):
  - processo principal: descomprime o .gz, parte o stream em blocos com releases
    completas, envia-os aos workers e escreve os resultados nas bases de dados;
  - N processos worker: fazem o parse do XML de cada bloco (sem partilhar GIL).

Opcionais que aceleram: `pip install lxml` (parser) e `pip install isal` (gzip).
"""

from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import os
import re
import sqlite3
import time
from collections import defaultdict
from pathlib import Path
from typing import Any

from tqdm import tqdm

try:  # parser em C, mais rápido que o do stdlib
    from lxml import etree as ET
except ImportError:
    import xml.etree.ElementTree as ET

try:  # descompressão gzip bastante mais rápida
    from isal import igzip as gzip_impl
except ImportError:
    import gzip as gzip_impl

DEFAULT_OUTPUT_DIR = Path("music")
DEFAULT_XML_PATH = Path("scripts") / "discogs_20261001_releases.xml.gz"

CHUNK_MB = 4          # tamanho (descomprimido) de cada bloco enviado a um worker
FLUSH_ROWS = 10_000   # linhas acumuladas por ano antes de escrever em disco
SCHEMA_VERSION = 2    # PRAGMA user_version das bases geradas

START_TAG = b"<release "
END_TAG = b"</release>"
YEAR_RE = re.compile(r"\b(?:18|19|20)\d{2}\b")
# caracteres de controlo inválidos em XML 1.0 (ASCII puro, seguro em UTF-8)
BAD_XML_BYTES = bytes(list(range(0, 9)) + [11, 12] + list(range(14, 32)))

SCHEMA = """
CREATE TABLE IF NOT EXISTS albums (
    id          INTEGER PRIMARY KEY,   -- id da release no Discogs
    title       TEXT,
    artist      TEXT,
    releaseDate TEXT,
    genres      TEXT,                  -- JSON: géneros + estilos
    tracks      TEXT                   -- JSON: títulos das faixas
)
"""
# INSERT OR IGNORE: se o ID já existir, mantém o registo antigo intacto e apenas adiciona os novos
INSERT_SQL = (
    "INSERT OR IGNORE INTO albums (id, title, artist, releaseDate, genres, tracks) "
    "VALUES (?, ?, ?, ?, ?, ?)"
)


def dumps(value: Any) -> str:
    """JSON compacto (sem espaços) e sem escapes \\uXXXX."""
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def get_db_path(output_dir: Path, year: int) -> Path:
    return output_dir / ("unknown.db" if year <= 0 else f"{year}.db")


# --------------------------------------------------------------------------- #
# Leitura: parte o .gz em blocos que contêm releases completas
# --------------------------------------------------------------------------- #
def iter_chunks(xml_path: Path, chunk_bytes: int):
    """Gera (posição_no_ficheiro_comprimido, bytes_com_releases_completas)."""
    with open(xml_path, "rb") as raw, gzip_impl.GzipFile(fileobj=raw) as gz:
        tail = b""
        while True:
            block = gz.read(chunk_bytes)
            if not block:
                break
            buf = tail + block
            cut = buf.rfind(END_TAG)
            if cut == -1:
                tail = buf
                continue
            cut += len(END_TAG)
            yield raw.tell(), buf[:cut]
            tail = buf[cut:]


# --------------------------------------------------------------------------- #
# Parse (corre nos workers)
# --------------------------------------------------------------------------- #
def parse_release(rel) -> tuple[int, tuple] | None:
    try:
        release_id = int(rel.get("id"))
    except (TypeError, ValueError):
        return None

    title = (rel.findtext("title") or "").strip()

    names = []
    for artist in rel.findall("artists/artist"):
        name = (artist.findtext("name") or "").strip()
        if name:
            names.append(name)
    artist_str = ", ".join(names) or "Unknown artist"

    released = (rel.findtext("released") or "").strip() or "Unknown"
    match = YEAR_RE.search(released)
    year = int(match.group()) if match else 0

    tags = {(g.text or "").strip() for g in rel.findall("genres/genre")}
    tags.update((s.text or "").strip() for s in rel.findall("styles/style"))
    tags.discard("")

    tracks = []
    for track in rel.findall("tracklist/track"):
        t = (track.findtext("title") or "").strip()
        if t:
            tracks.append(t)

    return year, (release_id, title, artist_str, released, dumps(sorted(tags)), dumps(tracks))


def parse_chunk(task: tuple[int, bytes]) -> tuple[int, dict[int, list[tuple]], int]:
    """Devolve (posição, {ano: [linhas]}, nº de releases ignoradas por erro)."""
    pos, data = task
    data = data.translate(None, delete=BAD_XML_BYTES)
    start = data.find(START_TAG)  # salta o cabeçalho <releases> no primeiro bloco
    if start == -1:
        return pos, {}, 0
    body = data[start:]

    bad = 0
    try:
        releases = list(ET.fromstring(b"<r>" + body + b"</r>"))
    except ET.ParseError:
        # Algo malformado no bloco: tenta release a release e ignora só as más.
        releases = []
        for piece in body.split(END_TAG):
            piece = piece.strip()
            if not piece:
                continue
            try:
                releases.append(ET.fromstring(piece + END_TAG))
            except ET.ParseError:
                bad += 1

    by_year: dict[int, list[tuple]] = defaultdict(list)
    for rel in releases:
        parsed = parse_release(rel)
        if parsed is None:
            bad += 1
        else:
            by_year[parsed[0]].append(parsed[1])
    return pos, dict(by_year), bad


# --------------------------------------------------------------------------- #
# Escrita (processo principal, conexões persistentes, um buffer por ano)
# --------------------------------------------------------------------------- #
class YearWriter:
    def __init__(self, output_dir: Path, flush_rows: int = FLUSH_ROWS) -> None:
        self.output_dir = output_dir
        self.flush_rows = flush_rows
        self.conns: dict[int, sqlite3.Connection] = {}
        self.buffers: dict[int, list[tuple]] = defaultdict(list)
        self.total = 0

    def _conn(self, year: int) -> sqlite3.Connection:
        conn = self.conns.get(year)
        if conn is None:
            conn = sqlite3.connect(get_db_path(self.output_dir, year))
            conn.execute("PRAGMA journal_mode = OFF")
            conn.execute("PRAGMA synchronous = OFF")
            conn.execute("PRAGMA locking_mode = EXCLUSIVE")
            conn.execute(SCHEMA)
            conn.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
            self.conns[year] = conn
        return conn

    def _flush(self, year: int) -> None:
        buf = self.buffers[year]
        if buf:
            conn = self._conn(year)
            conn.executemany(INSERT_SQL, buf)
            conn.commit()
            buf.clear()

    def add(self, rows_by_year: dict[int, list[tuple]]) -> None:
        for year, rows in rows_by_year.items():
            buf = self.buffers[year]
            buf.extend(rows)
            self.total += len(rows)
            if len(buf) >= self.flush_rows:
                self._flush(year)

    def close(self, artist_index: bool) -> None:
        for year in list(self.buffers):
            self._flush(year)
        for conn in tqdm(self.conns.values(), desc="A finalizar", unit=" db", disable=not artist_index):
            if artist_index:
                conn.execute("CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist)")
            conn.commit()
            conn.close()


# --------------------------------------------------------------------------- #
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--xml-path", type=Path, default=DEFAULT_XML_PATH, help="Caminho para o ficheiro .xml.gz")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Pasta de destino para os .db")
    parser.add_argument(
        "--workers", type=int, default=max(1, (os.cpu_count() or 2) - 1),
        help="Processos de parse em paralelo (padrão: nº de CPUs - 1)",
    )
    parser.add_argument("--chunk-mb", type=float, default=CHUNK_MB, help="Tamanho dos blocos enviados aos workers")
    parser.add_argument(
        "--artist-index", action="store_true",
        help="Cria índice por artista no fim (útil para pesquisas, mas aumenta bastante o tamanho)",
    )
    parser.add_argument("--overwrite", action="store_true", help="Apaga os .db já existentes na pasta de destino antes de começar")
    args = parser.parse_args()

    if not args.xml_path.exists():
        print(f"Erro: O ficheiro '{args.xml_path}' não foi encontrado.")
        return 1

    args.output_dir.mkdir(parents=True, exist_ok=True)
    existing = [p for pat in ("*.db", "*.db-wal", "*.db-shm", "*.db-journal") for p in args.output_dir.glob(pat)]
    if existing:
        if args.overwrite:
            for p in existing:
                p.unlink()
        else:
            print(f"A atualizar bases de dados existentes em '{args.output_dir}' (modo incremental)...")

    writer = YearWriter(args.output_dir)
    bad_total = 0
    t0 = time.time()
    pbar = tqdm(
        total=args.xml_path.stat().st_size, unit="B", unit_scale=True, unit_divisor=1024,
        desc="A processar", dynamic_ncols=True,
    )
    print(f"A processar com {args.workers} workers...")

    try:
        chunks = iter_chunks(args.xml_path, int(args.chunk_mb * 1024 * 1024))
        with mp.Pool(args.workers) as pool:
            for pos, rows_by_year, bad in pool.imap_unordered(parse_chunk, chunks):
                writer.add(rows_by_year)
                bad_total += bad
                pbar.n = max(pbar.n, pos)  # progresso = bytes comprimidos já lidos
                pbar.set_postfix(albuns=f"{writer.total:,}", refresh=True)
    except KeyboardInterrupt:
        print("\nInterrompido pelo utilizador; a guardar o que já foi processado...")
    finally:
        pbar.close()
        writer.close(args.artist_index)

    size_mb = sum(p.stat().st_size for p in args.output_dir.glob("*.db")) / 1024**2
    print(
        f"\nConcluído em {time.time() - t0:,.0f}s: {writer.total:,} álbuns processados, "
        f"{bad_total:,} ignorados por XML inválido, {size_mb:,.0f} MB em '{args.output_dir}/'."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())