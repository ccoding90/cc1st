# 도감 시트(저장소 루트의 1794383207.png = STONE MONSTERS 1, 1794383363.png = STONE MONSTERS 2)에서 56종 스프라이트 추출 (순수 파이썬). 사용법:
#   python3 tools/stonemon/extract.py . /tmp/out "$(cat tools/stonemon/tune.json)"
#   python3 tools/stonemon/atlas.py /tmp/out public/stonemon/monsters.png src/components/stonemon/atlas.js
# 굵은 외곽선을 경계로 칸 가장자리에서 배경을 flood fill 로 지우고, 가장 큰 덩어리(몬스터)만 남긴다.
# tune.json: 칸(격자 순서)별 보정값 — dark 외곽선 밝기 기준, dil 외곽선 두께 보강, step 색 변화 기반 확장,
#   seed 배경색과 비슷한 가장자리에서만 시작, nob/not 아래/위 가장자리 시작 금지, top/lab/right 자르기, band 회색 프레임 제거, key 색상 키
import sys, os
sys.path.insert(0, os.path.dirname(__file__)); import png
from collections import deque
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
COLS1=[(20,154),(162,295),(304,438),(446,571),(587,721),(729,862),(872,1005)]
COLS2=[(20,154),(162,295),(304,438),(447,579),(588,721),(729,862),(872,1005)]
ROWS=[(15,149),(158,292),(299,429),(436,564)]
def cells(sheet):
    C = COLS1 if sheet==1 else COLS2
    mid = [(87,212),(224,293)] if sheet==1 else [(88,212),(222,293)]
    base = 0 if sheet==1 else 28
    order=[]  # (id, x0,y0,x1,y1)
    n=base
    r0=[0,1,2,None,4,5,6]
    for ci in r0:
        if ci is None: continue
        n+=1; order.append((n,)+(C[ci][0],ROWS[0][0],C[ci][1],ROWS[0][1]))
    row2=[]
    for ci in [0,1,2]: n+=1; order.append((n,C[ci][0],ROWS[1][0],C[ci][1],ROWS[1][1]))
    n+=1; order.append((n,C[3][0],mid[0][0],C[3][1],mid[0][1]))
    n+=1; order.append((n,C[3][0],mid[1][0],C[3][1],mid[1][1]))
    for ci in [4,5,6]: n+=1; order.append((n,C[ci][0],ROWS[1][0],C[ci][1],ROWS[1][1]))
    for ri in [2,3]:
        for ci in range(7): n+=1; order.append((n,C[ci][0],ROWS[ri][0],C[ci][1],ROWS[ri][1]))
    return order
def run(sheet, path, tune):
    w,h,px=png.read_png(path)
    res={}
    for (sid,x0,y0,x1,y1) in cells(sheet):
        mid = (y1-y0) < 140 and sheet and (x0>440 and x0<450)
        t = tune.get(sid, {})
        lab = t.get('lab', 30 if (y1-y0)>100 else 24)
        cx0,cy0,cx1,cy1 = x0+9, t.get('top', y0+9), x1-9-t.get('right',0), y1-lab
        W,H = cx1-cx0+1, cy1-cy0+1
        get=lambda x,y: px[(cy0+y)*w+cx0+x]
        dk = t.get('dark', 100)
        d0=[[sum(get(x,y)[:3])/3<dk for x in range(W)] for y in range(H)]
        R=t.get('dil',1)
        dark=[[any(d0[yy][xx] for yy in range(max(0,y-R),min(H,y+R+1)) for xx in range(max(0,x-R),min(W,x+R+1))) for x in range(W)] for y in range(H)]
        filled=[[False]*W for _ in range(H)]
        stol=t.get('seed')
        refs=[get(x,y)[:3] for (x,y) in ((0,0),(W-1,0),(0,H//2),(W-1,H//2),(0,H-1),(W-1,H-1),(W//4,0),(3*W//4,0))]
        def seedok(x,y):
            if t.get('nob') and y==H-1: return False
            if t.get('not') and y==0: return False
            if not stol: return True
            c=get(x,y)[:3]
            return any(max(abs(c[0]-r[0]),abs(c[1]-r[1]),abs(c[2]-r[2]))<stol for r in refs)
        q=deque()
        for x in range(W):
            for y in (0,H-1):
                if seedok(x,y): q.append((x,y))
        for y in range(H):
            for x in (0,W-1):
                if seedok(x,y): q.append((x,y))
        key=t.get('key')
        if key:
            # 색상 키: 배경 팔레트(샘플 좌표)와 비슷한 화소만 따라 번진다
            pal=[get(min(W-1,max(0,a)),min(H-1,max(0,b)))[:3] for a,b in key['pts']]
            tol=key.get('tol',26)
            def isbg(x,y):
                c=get(x,y)[:3]
                return any(max(abs(c[0]-r[0]),abs(c[1]-r[1]),abs(c[2]-r[2]))<tol for r in pal)
            q=deque((x,y) for x in range(W) for y in (0,H-1))
            q.extend((x,y) for y in range(H) for x in (0,W-1))
            while q:
                x,y=q.popleft()
                if x<0 or y<0 or x>=W or y>=H or filled[y][x] or dark[y][x] or not isbg(x,y): continue
                filled[y][x]=True
                q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
            q=deque()
        step=t.get('step')
        if step:
            # 색 변화 기반 영역 확장: 이웃과 색 차이가 작을 때만 배경으로 번진다 (외곽선·경계에서 멈춤)
            col=[[get(x,y)[:3] for x in range(W)] for y in range(H)]
            def diff(a,b): return max(abs(a[0]-b[0]),abs(a[1]-b[1]),abs(a[2]-b[2]))
            q=deque()
            for x in range(W):
                for y in (0,H-1):
                    if seedok(x,y): q.append((x,y,None))
            for y in range(H):
                for x in (0,W-1):
                    if seedok(x,y): q.append((x,y,None))
            while q:
                x,y,pc=q.popleft()
                if x<0 or y<0 or x>=W or y>=H or filled[y][x] or dark[y][x]: continue
                if pc is not None and diff(col[y][x],pc)>step: continue
                filled[y][x]=True
                c=col[y][x]
                q.extend(((x+1,y,c),(x-1,y,c),(x,y+1,c),(x,y-1,c)))
        while q:
            x,y=q.popleft()
            if x<0 or y<0 or x>=W or y>=H or filled[y][x] or dark[y][x]: continue
            filled[y][x]=True
            q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
        for (ba,bb) in t.get('band',[]):
            for yy in range(max(0,ba-cy0),min(H,bb-cy0+1)):
                for x in range(W):
                    c=get(x,yy)[:3]
                    if max(c)-min(c)<t.get('bsat',24): filled[yy][x]=True
        ng=t.get('nogreen',0)
        for yy in range(max(0,H-ng),H):
            for x in range(W):
                r,g,b=get(x,yy)[:3]
                if (g>r+10 and g>=b) or (t.get('greenish') and g>=r-2): filled[yy][x]=True
        if t.get('dbg'):
            dbg=[]
            for y in range(H):
                for x in range(W):
                    c=get(x,y)
                    dbg.append((255,0,0,255) if filled[y][x] else ((0,0,0,255) if dark[y][x] else c))
            png.write_png(f'{OUT}/dbg{sid:02d}.png',W,H,dbg)
        # 테두리에 붙은 어두운 선(배경 선)도 제거: 채워진 영역에 둘러싸인 어두운 화소 중 가장자리 연결
        comp=[[0]*W for _ in range(H)]; sizes={}; k=0
        for y in range(H):
            for x in range(W):
                if filled[y][x] or comp[y][x]: continue
                k+=1; cnt=0; q=deque([(x,y)]); comp[y][x]=k
                while q:
                    a,b=q.popleft(); cnt+=1
                    for na,nb in ((a+1,b),(a-1,b),(a,b+1),(a,b-1)):
                        if 0<=na<W and 0<=nb<H and not filled[nb][na] and not comp[nb][na]:
                            comp[nb][na]=k; q.append((na,nb))
                sizes[k]=cnt
        best=max(sizes,key=sizes.get)
        keep=set([best]+[c for c in sizes if sizes[c]>=t.get('extra',10**9)])
        # 바깥 1px 테두리(배경색) 다듬기: 채워진 영역과 맞닿은 밝은 화소 제거
        trim=[]
        for y in range(H):
            for x in range(W):
                if comp[y][x] in keep and not d0[y][x]:
                    if any(0<=na<W and 0<=nb<H and filled[nb][na] for na,nb in ((x+1,y),(x-1,y),(x,y+1),(x,y-1))): trim.append((x,y))
        for x,y in trim: comp[y][x]=0
        xs=[x for y in range(H) for x in range(W) if comp[y][x] in keep]
        ys=[y for y in range(H) for x in range(W) if comp[y][x] in keep]
        bx0,bx1,by0,by1=min(xs),max(xs),min(ys),max(ys)
        ow,oh=bx1-bx0+1,by1-by0+1
        out=[]
        for y in range(by0,by1+1):
            for x in range(bx0,bx1+1):
                out.append(get(x,y)[:3]+(255,) if comp[y][x] in keep else (0,0,0,0))
        png.write_png(f'{OUT}/{sid:02d}.png',ow,oh,out)
        res[sid]=(ow,oh, bx0==0 or by0==0 or bx1==W-1 or by1==H-1)
    return res
import json
tune=json.loads(sys.argv[3]) if len(sys.argv)>3 else {}
tune={int(k):v for k,v in tune.items()}
r=run(1,f'{SRC}/1794383207.png',tune); r.update(run(2,f'{SRC}/1794383363.png',tune))
for k in sorted(r): print(k, r[k])
