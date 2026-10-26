import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('servidor entrega página, suporta busca no vídeo e limita os arquivos publicados', { timeout: 15000 }, async (context) => {
  const server = spawn(process.execPath, ['scripts/dev.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  context.after(() => server.kill());
  const [chunk] = await once(server.stdout, 'data');
  const origin = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(origin, 'servidor informa a porta que realmente está em uso');
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Cultura 3D/);
  const video = await fetch(`${origin}/assets/videos/cultura-imaginacao.mp4`, { headers: { Range: 'bytes=0-1023' } });
  assert.equal(video.status, 206);
  assert.match(video.headers.get('Content-Range'), /^bytes 0-1023\/\d+$/);
  assert.equal((await video.arrayBuffer()).byteLength, 1024);
  const invalidRange = await fetch(`${origin}/assets/videos/cultura-imaginacao.mp4`, { headers: { Range: 'bytes=999999999-' } });
  assert.equal(invalidRange.status, 416);
  assert.equal((await fetch(`${origin}/package.json`)).status, 404);
  assert.equal((await fetch(`${origin}/assets/originals/dragao.stl`)).status, 404);
  assert.equal((await fetch(`${origin}/src/%5c..%5cREADME.md`)).status, 403);
});
