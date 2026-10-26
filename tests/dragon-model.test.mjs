import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { parseDragonGlb } from "../src/dragon-model.js";

const source = readFileSync(
  new URL("../assets/models/dragao.glb.gz", import.meta.url),
);
const binary = gunzipSync(source);
const buffer = binary.buffer.slice(
  binary.byteOffset,
  binary.byteOffset + binary.byteLength,
);
test("modelo otimizado tem volume real, normais e índices válidos", () => {
  const model = parseDragonGlb(buffer);
  assert.equal(model.indices.length / 3, 150000);
  assert.equal(model.positions.length, model.normals.length);
  for (let axis = 0; axis < 3; axis++) {
    let min = Infinity,
      max = -Infinity;
    for (let i = axis; i < model.positions.length; i += 3) {
      min = Math.min(min, model.positions[i]);
      max = Math.max(max, model.positions[i]);
    }
    assert.ok(
      max - min > 2,
      "malha tem extensão nos três eixos, sem ser uma superfície plana",
    );
  }
  for (let i = 0; i < model.normals.length; i += 3)
    assert.ok(
      Math.abs(Math.hypot(...model.normals.subarray(i, i + 3)) - 1) < 0.002,
    );
});
test("recusa modelo truncado ou cabeçalho inválido", () => {
  assert.throws(() => parseDragonGlb(buffer.slice(0, 40)));
  assert.throws(() => parseDragonGlb(new ArrayBuffer(32)));
});
