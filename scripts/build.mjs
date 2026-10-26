import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
// Remove saídas antigas para não publicar arquivos que deixaram de ser usados.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// Publica somente os arquivos usados pela página, sem os originais de produção.
for (const entry of ["index.html", "src", "assets/images", "assets/videos", "assets/models", "assets/fonts", "assets/vendor"])
  await cp(path.join(root, entry), path.join(output, entry), {
    recursive: true,
  });
const video = await stat(
  path.join(output, "assets/videos/cultura-imaginacao.mp4"),
);
console.log(
  `Site estático pronto em dist/. Vídeo incluído: ${(video.size / 1e6).toFixed(2)} MB.`,
);
