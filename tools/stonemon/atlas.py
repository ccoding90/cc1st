# 추출한 칸(격자 위치) → 도감 번호로 매핑 · 오른쪽을 보게 좌우 반전 · 한 장의 아틀라스로 묶기
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__)); import png
SRC, OUT_PNG, OUT_JS = sys.argv[1], sys.argv[2], sys.argv[3]
POS2ID = {**{p: p for p in range(1, 57)}, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 4,
          32: 33, 33: 34, 34: 35, 35: 36, 36: 37, 37: 38, 38: 32}
FACING_RIGHT = {4, 36}  # 원본이 이미 오른쪽을 보는 종 (브퉁이, 데이노)
sprites = {}
for pos in range(1, 57):
    w, h, px = png.read_png(f'{SRC}/{pos:02d}.png')
    sid = POS2ID[pos]
    if sid not in FACING_RIGHT:
        px = [px[y * w + (w - 1 - x)] for y in range(h) for x in range(w)]
    sprites[sid] = (w, h, px)
assert sorted(sprites) == list(range(1, 57))
AW = 1024; x = y = rowh = 0; rects = {}
for sid in range(1, 57):
    w, h, _ = sprites[sid]
    if x + w + 2 > AW: x = 0; y += rowh + 2; rowh = 0
    rects[sid] = (x, y, w, h); x += w + 2; rowh = max(rowh, h)
AH = y + rowh
canvas = [(0, 0, 0, 0)] * (AW * AH)
for sid, (rx, ry, w, h) in rects.items():
    _, _, px = sprites[sid]
    for yy in range(h):
        canvas[(ry + yy) * AW + rx:(ry + yy) * AW + rx + w] = px[yy * w:(yy + 1) * w]
png.write_png(OUT_PNG, AW, AH, canvas)
with open(OUT_JS, 'w') as f:
    f.write('// 자동 생성: tools/stonemon/atlas.py — 도감 이미지(STONE MONSTERS 1·2)에서 추출한 56종 스프라이트 위치 [x, y, w, h]\n')
    f.write('// 모든 스프라이트는 오른쪽을 바라보도록 정렬되어 있다.\n')
    f.write(f"export const ATLAS_URL = '/stonemon/monsters.png';\nexport const ATLAS_SIZE = [{AW}, {AH}];\n")
    f.write('export const ATLAS = {\n' + ''.join(f'  {sid}: {list(r)},\n' for sid, r in sorted(rects.items())) + '};\n')
print(AW, AH)
