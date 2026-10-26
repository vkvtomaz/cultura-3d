// Reader for our generated GLB (indexed positions and normals, no textures).
export function parseDragonGlb(buffer) {
  const view = new DataView(buffer);
  if (
    buffer.byteLength < 28 ||
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== buffer.byteLength
  )
    throw new Error("Arquivo 3D inválido.");
  let json, binaryOffset, binaryLength;
  for (let offset = 12; offset < buffer.byteLength; ) {
    if (offset + 8 > buffer.byteLength) throw new Error("Modelo incompleto.");
    const length = view.getUint32(offset, true),
      type = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + length > buffer.byteLength)
      throw new Error("Modelo incompleto.");
    if (type === 0x4e4f534a)
      json = JSON.parse(
        new TextDecoder().decode(new Uint8Array(buffer, start, length)),
      );
    if (type === 0x004e4942) {
      binaryOffset = start;
      binaryLength = length;
    }
    offset = start + length;
  }
  const primitive = json?.meshes?.[0]?.primitives?.[0];
  if (!primitive || binaryOffset === undefined || (primitive.mode ?? 4) !== 4)
    throw new Error("Estrutura do modelo não suportada.");
  function read(index, width, componentType, Constructor) {
    const accessor = json.accessors?.[index],
      entry = json.bufferViews?.[accessor?.bufferView];
    if (
      !accessor ||
      !entry ||
      accessor.componentType !== componentType ||
      accessor.type !== (width === 3 ? "VEC3" : "SCALAR") ||
      entry.buffer !== 0 ||
      accessor.sparse ||
      entry.byteStride ||
      !Number.isSafeInteger(accessor.count) ||
      accessor.count < 1
    )
      throw new Error("Dados geométricos não suportados.");
    const offset = (entry.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const length = accessor.count * width;
    const bytes = length * Constructor.BYTES_PER_ELEMENT;
    if (
      offset < 0 ||
      offset % Constructor.BYTES_PER_ELEMENT ||
      offset + bytes > binaryLength ||
      (accessor.byteOffset ?? 0) + bytes > entry.byteLength
    )
      throw new Error("Dados geométricos incompletos.");
    return new Constructor(buffer, binaryOffset + offset, length);
  }
  const positions = read(primitive.attributes.POSITION, 3, 5126, Float32Array);
  const normals = read(primitive.attributes.NORMAL, 3, 5126, Float32Array);
  const indices = read(primitive.indices, 1, 5125, Uint32Array);
  if (normals.length !== positions.length || indices.length % 3)
    throw new Error("Malha inconsistente.");
  for (const value of positions)
    if (!Number.isFinite(value)) throw new Error("Coordenada inválida.");
  for (const value of indices)
    if (value >= positions.length / 3) throw new Error("Índice inválido.");
  return { positions, normals, indices };
}

// Usa o GLB comprimido quando o navegador consegue descompactá-lo.
export async function loadDragonModel() {
  const compressed = typeof DecompressionStream !== "undefined";
  const url = new URL(
    `../assets/models/dragao.glb${compressed ? ".gz" : ""}`,
    import.meta.url,
  );
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar o modelo.");
  const buffer = compressed
    ? await new Response(
        response.body.pipeThrough(new DecompressionStream("gzip")),
      ).arrayBuffer()
    : await response.arrayBuffer();
  return parseDragonGlb(buffer);
}
