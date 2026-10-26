import { getRecentAlbums, getAlbumsByIds, getAlbumById, getTracksByAlbum, searchAlbums, searchTracks, getAlbumsByArtist } from "./catalog.ts";

export function createCatalogServer() {
  return function catalogMiddleware(req: any, res: any, next: any) {
    const url = req.url || "";
    const pathname = url.split("?")[0];
    if (!pathname.startsWith("/api/catalog") && !pathname.startsWith("/albums") && !pathname.startsWith("/album") && !pathname.startsWith("/tracks") && !pathname.startsWith("/search")) {
      return next();
    }
    const query = Object.fromEntries(
      new URLSearchParams(url.split("?")[1] || "")
    ) as Record<string, string>;

    const sendJson = (data: unknown, status = 200) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(data));
    };

    const handle = async () => {
      try {
        if (pathname === "/api/catalog/albums" || pathname === "/albums") {
          const limit = parseInt(query.limit ?? "20", 10) || 20;
          return sendJson(getRecentAlbums(limit));
        }
        if (pathname === "/api/catalog/albums-by-id" || pathname === "/albums-by-id") {
          const idsStr = query.ids ?? "";
          const ids = idsStr ? idsStr.split(",").map((s) => s.trim()).filter(Boolean) : [];
          return sendJson(getAlbumsByIds(ids));
        }
        if (pathname === "/api/catalog/album" || pathname === "/album") {
          return sendJson(getAlbumById(query.id ?? ""));
        }
        if (pathname === "/api/catalog/tracks" || pathname === "/tracks") {
          return sendJson(getTracksByAlbum(query.albumId ?? ""));
        }
        if (pathname === "/api/catalog/search" || pathname === "/search") {
          const kind = query.kind ?? "albums";
          const q = query.q ?? "";
          const limit = parseInt(query.limit ?? "30", 10) || 30;
          const offset = parseInt(query.offset ?? "0", 10) || 0;
          if (kind === "tracks") {
            return sendJson(searchTracks(q, limit));
          }
          return sendJson(searchAlbums(q, limit, offset, {
            decade: query.decade || undefined,
            year: query.year || undefined,
            genre: query.genre || undefined,
          }));
        }
        if (pathname === "/api/catalog/albums-by-artist" || pathname === "/albums-by-artist") {
          const artist = query.artist ?? "";
          const limit = parseInt(query.limit ?? "50", 10) || 50;
          const offset = parseInt(query.offset ?? "0", 10) || 0;
          return sendJson(getAlbumsByArtist(artist, limit, offset));
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        return;
      }
      next();
    };

    handle();
  };
}

export function injectCatalogMiddleware(server: any) {
  const middleware = createCatalogServer();
  // Force o middleware de catálogo a rodar antes do fallback de HTML do Vite.
  if (server.middlewares && Array.isArray(server.middlewares.stack)) {
    server.middlewares.stack.unshift({ route: "", handle: middleware });
  } else {
    server.middlewares.use(middleware);
  }
}
