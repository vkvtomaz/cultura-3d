"""Create a web GLB from the supplied binary STL; never modifies the source."""
import gzip
import json
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools' / 'python'))
import numpy as np
import fast_simplification

source = ROOT / 'assets' / 'originals' / 'dragao.stl'
data = source.read_bytes()
count = struct.unpack_from('<I', data, 80)[0]
if len(data) != 84 + count * 50:
    raise ValueError('Expected a complete binary STL.')
records = np.frombuffer(data, dtype=np.dtype([
    ('normal', '<f4', (3,)), ('vertices', '<f4', (3, 3)), ('attribute', '<u2')
]), offset=84, count=count)
vertices, inverse = np.unique(records['vertices'].reshape(-1, 3), axis=0, return_inverse=True)
faces = inverse.reshape(-1, 3)
if not np.isfinite(vertices).all():
    raise ValueError('STL has non-finite coordinates.')
points, triangles = fast_simplification.simplify(
    vertices.astype(np.float64), faces.astype(np.int32),
    target_count=150000, agg=5.0,
)
# Printing uses Z up. glTF uses Y up; this rotation preserves handedness.
minimum, maximum = points.min(axis=0), points.max(axis=0)
points = points - (minimum + maximum) * 0.5
points = np.column_stack((points[:, 0], points[:, 2], -points[:, 1]))
points *= 3.35 / (maximum[2] - minimum[2])
points = np.asarray(points, dtype='<f4')
triangles = np.asarray(triangles, dtype='<u4')

normals = np.zeros_like(points)
face_normals = np.cross(points[triangles[:, 1]] - points[triangles[:, 0]],
                        points[triangles[:, 2]] - points[triangles[:, 0]])
for corner in range(3):
    np.add.at(normals, triangles[:, corner], face_normals)
lengths = np.linalg.norm(normals, axis=1)
normals /= np.maximum(lengths[:, None], 1e-12)
normals = np.asarray(normals, dtype='<f4')
positions_bytes, normal_bytes, index_bytes = points.tobytes(), normals.tobytes(), triangles.tobytes()
binary = positions_bytes + normal_bytes + index_bytes
document = {
    'asset': {'version': '2.0', 'generator': 'Cultura 3D STL preparation'},
    'scene': 0, 'scenes': [{'nodes': [0]}],
    'nodes': [{'mesh': 0, 'name': 'Dragao'}],
    'meshes': [{'name': 'Dragao', 'primitives': [{
        'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2, 'material': 0,
    }]}],
    'materials': [{'name': 'Preto', 'pbrMetallicRoughness': {
        'baseColorFactor': [0.019, 0.021, 0.024, 1], 'metallicFactor': 0.08, 'roughnessFactor': 0.5,
    }}],
    'buffers': [{'byteLength': len(binary)}],
    'bufferViews': [
        {'buffer': 0, 'byteOffset': 0, 'byteLength': len(positions_bytes), 'target': 34962},
        {'buffer': 0, 'byteOffset': len(positions_bytes), 'byteLength': len(normal_bytes), 'target': 34962},
        {'buffer': 0, 'byteOffset': len(positions_bytes) + len(normal_bytes), 'byteLength': len(index_bytes), 'target': 34963},
    ],
    'accessors': [
        {'bufferView': 0, 'componentType': 5126, 'count': len(points), 'type': 'VEC3',
         'min': points.min(axis=0).tolist(), 'max': points.max(axis=0).tolist()},
        {'bufferView': 1, 'componentType': 5126, 'count': len(normals), 'type': 'VEC3'},
        {'bufferView': 2, 'componentType': 5125, 'count': int(triangles.size), 'type': 'SCALAR'},
    ],
}
json_bytes = json.dumps(document, separators=(',', ':')).encode()
json_bytes += b' ' * ((-len(json_bytes)) % 4)
binary += b'\0' * ((-len(binary)) % 4)
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(json_bytes) + 8 + len(binary))
glb += struct.pack('<II', len(json_bytes), 0x4E4F534A) + json_bytes
glb += struct.pack('<II', len(binary), 0x004E4942) + binary
output = ROOT / 'assets' / 'models'
output.mkdir(parents=True, exist_ok=True)
(output / 'dragao.glb').write_bytes(glb)
(output / 'dragao.glb.gz').write_bytes(gzip.compress(glb, compresslevel=9, mtime=0))
report = {
    'source': source.name, 'sourceBytes': len(data), 'sourceTriangles': count,
    'triangles': len(triangles), 'vertices': len(points),
    'glbBytes': len(glb), 'gzipBytes': (output / 'dragao.glb.gz').stat().st_size,
    'bounds': [points.min(axis=0).tolist(), points.max(axis=0).tolist()],
}
(ROOT / 'analysis').mkdir(parents=True, exist_ok=True)
(ROOT / 'analysis' / 'dragon-model.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
