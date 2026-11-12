import zlib, struct
def read_png(path):
    d=open(path,'rb').read()
    assert d[:8]==b'\x89PNG\r\n\x1a\n'
    i=8; idat=b''; w=h=0
    while i<len(d):
        n=struct.unpack('>I',d[i:i+4])[0]; t=d[i+4:i+8]; c=d[i+8:i+8+n]; i+=12+n
        if t==b'IHDR': w,h,bd,ct,_,_,il=struct.unpack('>IIBBBBB',c); assert bd==8 and il==0, (bd,il)
        elif t==b'IDAT': idat+=c
        elif t==b'IEND': break
    bpp={2:3,6:4}[ct]
    raw=zlib.decompress(idat); stride=w*bpp
    out=bytearray(h*stride); prev=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; p+=1; line=bytearray(raw[p:p+stride]); p+=stride
        for x in range(stride):
            a=line[x-bpp] if x>=bpp else 0; b=prev[x]; c=prev[x-bpp] if x>=bpp else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+((a+b)>>1))&255
            elif f==4:
                pp=a+b-c; pa=abs(pp-a); pb=abs(pp-b); pc=abs(pp-c)
                pr=a if pa<=pb and pa<=pc else (b if pb<=pc else c)
                line[x]=(line[x]+pr)&255
        out[y*stride:(y+1)*stride]=line; prev=line
    px=[]
    for k in range(0,len(out),bpp):
        px.append((out[k],out[k+1],out[k+2],out[k+3] if bpp==4 else 255))
    return w,h,px
def write_png(path,w,h,px):
    raw=bytearray()
    for y in range(h):
        raw.append(0)
        for x in range(w): raw.extend(px[y*w+x])
    def chunk(t,c): return struct.pack('>I',len(c))+t+c+struct.pack('>I',zlib.crc32(t+c)&0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b''))
