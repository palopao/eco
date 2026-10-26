import { createServer } from "vite";
import path from "node:path";
import { createCatalogServer } from "./catalog-server.ts";

async function main() {
  const port = parseInt(process.env.PORT || "8443", 10);
  const server = await createServer({
    configFile: path.resolve("vite.config.ts"),
    server: {
      port,
      strictPort: true,
    },
  });

  // Insere o middleware de catálogo no INÍCIO da chain do Connect,
  // antes do fallback de SPA do Vite (que retorna index.html).
  const catalogMiddleware = createCatalogServer();
  const mw: any = server.middlewares;
  if (mw && Array.isArray(mw.stack)) {
    mw.stack.unshift({ route: "", handle: catalogMiddleware });
  } else if (mw) {
    mw.use(catalogMiddleware);
  }

  await server.httpServer?.listen(port);
  console.log(`Eco dev server running on http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
