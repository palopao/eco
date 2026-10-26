#!/usr/bin/env python3
"""Catalog API that reads from yearly SQLite databases in music/ directory."""
from __future__ import annotations

import json
import os
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from typing import Any

MUSIC_DIR = Path(os.environ.get("ECO_MUSIC_DIR", "music"))
HOST = os.environ.get("ECO_CATALOG_HOST", "127.0.0.1")
PORT = int(os.environ.get("ECO_CATALOG_PORT", "8765"))


def get_db_files() -> list[Path]:
    """Get all year db files sorted."""
    if not MUSIC_DIR.exists():
        return []
    db_files = []
    for path in MUSIC_DIR.glob("*.db"):
        db_files.append(path)
    return sorted(db_files)


def get_all_dbs() -> list[tuple[Path, sqlite3.Connection]]:
    """Open all database connections."""
    conns = []
    for db_path in get_db_files():
        try:
            conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
            conn.row_factory = sqlite3.Row
            conns.append((db_path, conn))
        except Exception:
            continue
    return conns


def parse_genres(genres_json: str) -> list[str]:
    try:
        data = json.loads(genres_json) if genres_json else []
        if isinstance(data, list):
            return [g for g in data if isinstance(g, str)]
    except Exception:
        pass
    return []


def parse_tracks(tracks_json: str) -> list[str]:
    try:
        data = json.loads(tracks_json) if tracks_json else []
        if isinstance(data, list):
            return [t for t in data if isinstance(t, str)]
    except Exception:
        pass
    return []


def album_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    track_titles = parse_tracks(row["tracks"])
    genres = parse_genres(row["genres"])
    release_date = row["releaseDate"] or ""
    # Extract year
    year = 0
    try:
        if release_date and len(release_date) >= 4:
            year = int(release_date[:4])
    except Exception:
        pass
    track_count = len(track_titles)
    # Compute rough duration
    duration_min = track_count * 3  # rough estimate
    return {
        "id": str(row["id"]),
        "title": row["title"] or "",
        "artist": row["artist"] or "",
        "year": year,
        "releaseDate": release_date,
        "coverUrl": "/images/music-cover-placeholder.svg",
        "trackCount": track_count,
        "duration": f"{duration_min} min",
        "genres": genres,
        "averageRating": 0,
        "totalRatings": 0,
        "tracks": [
            {
                "id": f"{row['id']}:{i+1}",
                "albumId": str(row["id"]),
                "title": title,
                "duration": "3:00",
                "trackNumber": i+1,
            }
            for i, title in enumerate(track_titles)
        ],
    }


def search_albums(query: str, limit: int = 30) -> list[dict[str, Any]]:
    query_lower = query.lower()
    results = []
    conns = get_all_dbs()
    try:
        for db_path, conn in conns:
            cursor = conn.cursor()
            # Search in title, artist, genres
            cursor.execute("""
                SELECT * FROM albums 
                WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(genres) LIKE ?
                LIMIT ?
            """, (f"%{query_lower}%", f"%{query_lower}%", f"%{query_lower}%", limit))
            for row in cursor.fetchall():
                results.append(album_to_dict(row))
                if len(results) >= limit:
                    break
            if len(results) >= limit:
                break
    finally:
        for _, conn in conns:
            conn.close()
    return results[:limit]


def search_tracks(query: str, limit: int = 30) -> list[dict[str, Any]]:
    query_lower = query.lower()
    results = []
    conns = get_all_dbs()
    try:
        for db_path, conn in conns:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM albums")
            for row in cursor.fetchall():
                track_titles = parse_tracks(row["tracks"])
                for i, title in enumerate(track_titles):
                    if query_lower in title.lower():
                        album = album_to_dict(row)
                        results.append({
                            "id": f"{row['id']}:{i+1}",
                            "albumId": str(row["id"]),
                            "title": title,
                            "duration": "3:00",
                            "trackNumber": i+1,
                            "albumTitle": album["title"],
                            "artist": album["artist"],
                            "year": album["year"],
                        })
                        if len(results) >= limit:
                            break
                if len(results) >= limit:
                    break
            if len(results) >= limit:
                break
    finally:
        for _, conn in conns:
            conn.close()
    return results[:limit]


def get_album_by_id(album_id: str) -> dict[str, Any] | None:
    conns = get_all_dbs()
    try:
        for db_path, conn in conns:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM albums WHERE id = ?", (album_id,))
            row = cursor.fetchone()
            if row:
                return album_to_dict(row)
    finally:
        for _, conn in conns:
            conn.close()
    return None


def get_albums_by_ids(ids: list[str]) -> list[dict[str, Any]]:
    results = []
    id_set = set(ids)
    conns = get_all_dbs()
    try:
        for db_path, conn in conns:
            cursor = conn.cursor()
            placeholders = ','.join('?' * len(id_set))
            cursor.execute(f"SELECT * FROM albums WHERE id IN ({placeholders})", list(id_set))
            for row in cursor.fetchall():
                results.append(album_to_dict(row))
    finally:
        for _, conn in conns:
            conn.close()
    return results


def get_recent_albums(limit: int = 20) -> list[dict[str, Any]]:
    results = []
    conns = get_all_dbs()
    try:
        # Go through all dbs and collect some albums
        for db_path, conn in conns:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM albums ORDER BY RANDOM() LIMIT ?", (limit,))
            for row in cursor.fetchall():
                results.append(album_to_dict(row))
                if len(results) >= limit:
                    break
            if len(results) >= limit:
                break
    finally:
        for _, conn in conns:
            conn.close()
    return results[:limit]


def get_tracks_by_album(album_id: str) -> list[dict[str, Any]]:
    album = get_album_by_id(album_id)
    if album:
        return album.get("tracks", [])
    return []


class CatalogHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        try:
            if path == '/api/catalog/albums' or path == '/albums':
                limit = int(query.get('limit', ['20'])[0])
                albums = get_recent_albums(limit)
                self._send_json(albums)
                return
            elif path == '/api/catalog/albums-by-id' or path == '/albums-by-id':
                ids_str = query.get('ids', [''])[0]
                if ids_str:
                    ids = [id.strip() for id in ids_str.split(',') if id.strip()]
                else:
                    ids = query.get('ids[]', [])
                albums = get_albums_by_ids(ids)
                self._send_json(albums)
                return
            elif path == '/api/catalog/album' or path == '/album':
                album_id = query.get('id', [''])[0]
                album = get_album_by_id(album_id)
                self._send_json(album)
                return
            elif path == '/api/catalog/tracks' or path == '/tracks':
                album_id = query.get('albumId', [''])[0]
                tracks = get_tracks_by_album(album_id)
                self._send_json(tracks)
                return
            elif path == '/api/catalog/search' or path == '/search':
                kind = query.get('kind', ['albums'])[0]
                q = query.get('q', [''])[0]
                limit = int(query.get('limit', ['30'])[0])
                if kind == 'tracks':
                    results = search_tracks(q, limit)
                else:
                    results = search_albums(q, limit)
                self._send_json(results)
                return
            else:
                self._send_json({'error': 'Not found'}, 404)
                return
        except Exception as e:
            self._send_json({'error': str(e)}, 500)
            return

    def log_message(self, *args):
        # Suppress default logging
        pass


def run():
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, CatalogHandler)
    print(f'Catalog API running on http://{HOST}:{PORT}')
    httpd.serve_forever()


if __name__ == '__main__':
    run()
