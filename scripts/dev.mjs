import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const root = process.argv.includes("--dist")
  ? path.join(projectRoot, "dist")
  : projectRoot;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".glb": "model/gltf-binary",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    // Os arquivos de produção ficam fora das rotas públicas.
    if (relative.startsWith("assets/originals/")) {
      response.writeHead(404);
      response.end("Não encontrado");
      return;
    }
    if (
      !(
        relative === "index.html" ||
        relative.startsWith("src/") ||
        relative.startsWith("assets/")
      )
    ) {
      response.writeHead(404);
      response.end("Não encontrado");
      return;
    }
    const target = path.resolve(root, relative);
    const permitted =
      target === path.join(root, "index.html") ||
      target.startsWith(path.join(root, "src") + path.sep) ||
      target.startsWith(path.join(root, "assets") + path.sep);
    if (
      !permitted ||
      relative.split(/[\\/]/).some((part) => part.startsWith("."))
    ) {
      response.writeHead(403);
      response.end();
      return;
    }
    const info = await stat(target);
    if (!info.isFile()) {
      response.writeHead(404);
      response.end();
      return;
    }
    const headers = {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
      "Accept-Ranges": "bytes",
    };
    let start = 0,
      end = info.size - 1,
      status = 200;
    if (request.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!range || (!range[1] && !range[2])) {
        response.writeHead(416, { "Content-Range": `bytes */${info.size}` });
        response.end();
        return;
      }
      if (range[1]) {
        start = Number(range[1]);
        end = range[2] ? Math.min(Number(range[2]), end) : end;
      } else start = Math.max(0, info.size - Number(range[2]));
      if (
        !Number.isSafeInteger(start) ||
        !Number.isSafeInteger(end) ||
        start > end ||
        start >= info.size
      ) {
        response.writeHead(416, { "Content-Range": `bytes */${info.size}` });
        response.end();
        return;
      }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
    }
    response.writeHead(status, {
      ...headers,
      "Content-Length": Math.max(0, end - start + 1),
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const stream = createReadStream(target, { start, end });
    stream.on("error", () => response.destroy());
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 400);
    response.end("Não encontrado");
  }
});
let port = Number(process.env.PORT || 5173);
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") server.listen(++port, "127.0.0.1");
  else {
    console.error(error.message);
    process.exit(1);
  }
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Cultura 3D — http://127.0.0.1:${server.address().port}/`);
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
