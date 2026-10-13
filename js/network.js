// Mỗi chấm = 1 node. "Spheres": mỗi loại là 1 khối cầu riêng. "Layers": 4 tầng xếp chồng. Bấm vào 1 nhóm để phóng to.
(()=>{
const cv=document.getElementById('net'),x=cv.getContext('2d'),rnd=Math.random;
// ROOT = gốc site, tính từ vị trí file này (js/network.js → ../) để ảnh vẫn tải đúng khi trang nằm trong thư mục ngôn ngữ (/vi/, /ko/ …)
const ROOT=document.currentScript&&document.currentScript.src?new URL('../',document.currentScript.src).href:'';
const N=480,K=3,CY=.15,D=z=>Math.min(1,Math.max(0,(z+1.3)/2.6));
const TAG={l1:['Layer 1','#22d3ee'],l2:['Layer 2','#c084fc'],cosmos:['Cosmos','#60a5fa'],da:['Modular / DA','#34d399'],zk:['ZK','#fb923c']};
const PL=[{k:'l2',y:1,r:.8},{k:'zk',y:.5,r:.6},{k:'l1',y:0,r:1},{k:'da',y:-.75,r:.8}];
const SPIN=[.0003,-.0005,.0002,-.0003],SPIN2=[.0005,-.0007,.0003,-.0005];
const SC=[[0,.85,0],[.85,.3,.1],[0,-.02,0],[0,-.85,0]],SR=[.26,.22,.46,.28];
const ZS=[3,3.3,1.9,3],ZL=[2.2,2.8,1.5,2.2];
// tr(): dịch chữ do network.js tự vẽ (lang.js cung cấp window.apTr; chưa có thì giữ nguyên English). Chuỗi cần dịch được đăng ký ở window.apStrings.
const tr=s=>s&&window.apTr?window.apTr(s):s;
const NOTE={none:'Scroll to zoom, drag to rotate. Click a logo for details.',l1:'Base chains with their own validators.',l2:'Rollups that settle on Layer 1.',cosmos:'Sovereign chains linked by IBC.',da:'Where rollups publish their data.',zk:'Proofs sent up to Layer 1.',zoom:'Click a logo to open it. Click elsewhere to zoom out.'};
window.apStrings=(window.apStrings||[]).concat(Object.values(NOTE).filter(Boolean),Object.values(TAG).map(t=>t[0]),['Validator hub','Project //','TYPE','LINKS','NODE','Validator','Connected','Settle','Open project page','sys · node link ok','link','links','Close','Sound on/off','Validator at the center of the network, linked to the projects around it.']);
const PR=[['DYDX','DYDX',['cosmos','l1']],['Celestia','CELESTIA',['da','cosmos']],['Nibiru','NIBIRU',['cosmos','l1']],['Pactus','PACTUS',['l1']],['ZetaChain','ZETACHAIN',['l1','cosmos']],
['Warden','WARDEN',['cosmos','l1']],['AirChains','AIRCHAINS',['l2','zk']],['Pryzm','PRYZM',['cosmos']],['Initia','INITIA',['l1','cosmos']],['Self Chain','SELF-CHAIN',['cosmos','l1']],
['Shardeum','SHARDEUM',['l1']],['Namada','NAMADA',['l1']],['Aligned Layer','ALIGNED-LAYER',['zk']],['Dymension','DYMENSION',['l2','cosmos']],['Avail','AVAIL',['da']],['0G Labs','OG-LAB',['l1']],['MANTRA','MANTRA',['cosmos','l1']]]
.map(([n,f,t])=>{const im=new Image();im.src=ROOT+'assets/Projectlogos/'+f+'.png';return{n,t,im}});
const hubIm=new Image();hubIm.src=ROOT+'assets/logo.jpg';
let filter=null,mx=-1e3,my=-1e3,hov=null,moved=0,m=0,target=1,selG=2,zt=0,zz=0;
// ---- node
const P=[];
for(let i=0;i<N;i++)P.push({u:null,v:i%14===0,ph:rnd()*6.28,f:0,pl:[2,2,2,2,2,0,0,1,3,3][i%10]});
PR.forEach((p,k)=>{const i=Math.round((k+.5)*N/PR.length);P[i].logo=p;P[i].v=false;p.i=i});
const by=n=>PR.find(p=>p.n===n);
const HUB=N;P.push({u:[0,0,0],v:false,ph:0,f:0,pl:2,logo:{n:'ApolloSYNC',t:[],im:hubIm,sub:'Validator',hub:true},i:N});
const ring=['DYDX','Nibiru','ZetaChain','Warden','Pryzm','Initia','Self Chain','MANTRA','Pactus','Shardeum','Namada','0G Labs'];
const FIX={'AirChains':[0,-.35,.1],'Dymension':[0,.35,-.1],'Aligned Layer':[1,0,.28],'Celestia':[3,-.4,0],'Avail':[3,.4,0]};
for(const p of PR){const q=P[p.i];if(FIX[p.n]){q.pl=FIX[p.n][0];q.w=[FIX[p.n][1],PL[q.pl].y-CY,FIX[p.n][2]]}}
ring.forEach((n,k)=>{const q=P[by(n).i],a=k/ring.length*6.2832;q.pl=2;q.w=[Math.cos(a)*.68,-CY,Math.sin(a)*.68]});
P[HUB].w=[0,-CY,0];
PL.forEach((pl,pi)=>{
 // tầng: hoa hướng dương trên đĩa
 const g=P.filter(q=>q.pl===pi&&!q.w);g.forEach((q,k)=>{const a=k*2.39996,r=pl.r*Math.sqrt((k+.5)/g.length);q.w=[Math.cos(a)*r,pl.y-CY,Math.sin(a)*r]});
 // khối cầu: Fibonacci trên mặt cầu, logo cách đều
 const h=P.filter(q=>q.pl===pi&&q!==P[HUB]),lg=h.filter(q=>q.logo),ot=h.filter(q=>!q.logo),n=h.length,sl=new Array(n).fill(null);
 lg.forEach((q,j)=>sl[Math.round((j+.5)*n/lg.length)%n]=q);let o=0;for(let s=0;s<n;s++)if(!sl[s])sl[s]=ot[o++];
 sl.forEach((q,s)=>{const y=1-2*(s+.5)/n,r=Math.sqrt(1-y*y),t=s*2.39996;q.u=[Math.cos(t)*r,y,Math.sin(t)*r]})});
// cạnh: mỗi nhóm nối K node gần nhất
function knn(ids,pos){const E=[],seen=new Set(),adj={};ids.forEach(i=>adj[i]=[]);
 for(const i of ids){const d=ids.filter(j=>j!==i).map(j=>[j,pos(i).reduce((s,v,a)=>s+(v-pos(j)[a])**2,0)]).sort((a,b)=>a[1]-b[1]).slice(0,K);
  for(const[j]of d){const k=i<j?i+'-'+j:j+'-'+i;if(seen.has(k))continue;seen.add(k);E.push([i,j]);adj[i].push(E.length-1);adj[j].push(E.length-1)}}return{E,adj}}
function build(pos,skipHub){const E=[],A={};PL.forEach((_,pi)=>{const ids=P.map((q,i)=>q.pl===pi&&!(skipHub&&i===HUB)?i:-1).filter(i=>i>=0),r=knn(ids,pos),o=E.length;r.E.forEach(e=>E.push(e));for(const i in r.adj)A[i]=r.adj[i].map(e=>e+o)});return{E,adj:A}}
const SP=build(i=>P[i].u,true),LY=build(i=>P[i].w,false);
// liên kết giữa các nhóm
const I=n=>by(n).i,cosm=ring.filter(n=>by(n).t.includes('cosmos')),LK=[];
cosm.forEach((n,k)=>LK.push([I(n),I(cosm[(k+1)%cosm.length]),'cosmos','#60a5fa']));
LK.push([I('Celestia'),I('Avail'),'da','#34d399']);
['AirChains','Dymension'].forEach(n=>LK.push([I(n),HUB,'l2','#c084fc'],[I(n),I('Celestia'),'da','#34d399'],[I(n),I('Avail'),'da','#34d399']));
LK.push([I('AirChains'),I('Aligned Layer'),'zk','#fb923c'],[I('Aligned Layer'),HUB,'zk','#fb923c']);
const LI=PR.map(p=>p.i).concat(HUB),S=P.map(()=>({x:0,y:0,z:0,s:1})),B=[];
let W,H,dpr,cx,cy,cy0,R,ay=0,ax=.5,vy=.0035,vx=0,drag=false,lx=0,ly=0,sy,cyy,sxx,cxx,FX=0,FY=0,FZ=0,ZM=1,sz=1;
// xoay tự do: UQ = quaternion người dùng (kéo chuột, theo trục màn hình) · U = ma trận 3x3 tương ứng, áp lên camera mặc định
// zoom tự do: UZ (đang hiển thị) / UZt (mục tiêu) · OX,OY = dịch chuyển màn hình để zoom ngay tại vị trí con trỏ · SPF = hệ số tự quay (giảm khi rê chuột vào) · TV = thời gian ảo cho tự quay
let U=[1,0,0,0,1,0,0,0,1],UQ=[1,0,0,0],UZ=1,UZt=1,OX=0,OY=0,OXt=0,OYt=0,SPF=1,TV=0,Tp=0,sel=null,overP=false;
const inMod=()=>{const zc=Math.max(UZ,1);return Math.abs(mx-cx-OX)<R*1.8*zc&&Math.abs(my-cy-OY)<R*1.9*zc};
const note=document.getElementById('note'),setNote=()=>{if(note)note.textContent=tr(zt?NOTE.zoom:NOTE[filter||'none'])};
const hit=()=>{if(overP)return null;let b=1,r=null;for(const i of LI){const s=S[i],d=Math.hypot(s.x-mx,s.y-my),rr=Math.max(26,(P[i].logo.hub?20:11+13*D(s.z))*s.s*sz+6);if(s.z>-.4&&d<rr&&d/rr<b){b=d/rr;r=i}}return r};
// ---- 2 bàn tay đá đỡ cả hệ sinh thái, dựng 3D từ chấm trắng, mô phỏng theo ảnh mẫu (bàn tay khum, ngón cái gập vào lòng bàn tay).
// Mô hình: bề mặt liền khối (signed-distance field): cổ tay + lòng bàn tay + gò ngón cái/út + 4 ngón thon dần 3 đốt + ngón cái 3 đốt, nối mượt bằng smooth-min.
// Lấy mẫu bề mặt → lọc đều (blue-noise) → tô sáng theo pháp tuyến thật của bề mặt để đọc ra khối.
// Hệ local (cm): gốc = cổ tay, +Y về phía ngón giữa, +Z = phía lòng bàn tay, +X = phía ngón cái (mô hình là TAY PHẢI, như ảnh mẫu). mir:1 = lật gương thành tay trái.
// HAND.tilt: camera của tay nghiêng ít hơn mạng lưới · sway: biên độ đung đưa khi xoay · gap: khoảng cách giữa các chấm (đơn vị thế giới) · light: hướng sáng
// HANDS[i].T: base = hướng gốc (cột = trục X,Y,Z của tay trong thế giới), rx/ry/rz = xoay thêm, s = cm→thế giới, tx/ty/tz = vị trí cổ tay · mir = lật gương
// POSE: tư thế bàn tay mẫu — fingers: x,y gốc ngón · L = độ dài 3 đốt · r = bán kính · yaw = xoè · a = góc gập 3 đốt (rad) | thumb: o = gốc, L = độ dài, a = [yaw,pitch] mỗi đốt, r = bán kính
const HAND={tilt:.155,sway:.1,gap:.0135,light:[-.35,.75,.55]};
const POSE={cup:0,wr:[3,2.7],
 fingers:[{x:2.5,y:8.6,L:[4.3,2.6,2.2],r:.95,yaw:.09,a:[.3,.42,.3]},{x:.85,y:8.9,L:[4.8,3,2.3],r:.98,yaw:.015,a:[.28,.42,.3]},
  {x:-.85,y:8.6,L:[4.4,2.8,2.2],r:.92,yaw:-.06,a:[.32,.46,.34]},{x:-2.5,y:7.9,L:[3.5,2.1,2],r:.8,yaw:-.17,a:[.36,.5,.36]}],
 thumb:{o:[2.3,.9,.3],L:[3.6,3,2.5],a:[[.55,.62],[0,.5],[-.75,.3]],r:[1.9,1.6,1.3,1]}};
const HANDS=[
 {T:{base:[[0,0,1],[0,1,0],[-1,0,0]],tx:-1.225,ty:-1.592,tz:-.3,rx:.1,ry:0,rz:-.3,s:.052},mir:1}, // tay TRÁI trên màn hình: nhỏ, xa, lòng bàn tay quay sang phải, ngón cái hướng ra phía người xem
 {T:{base:[[0,1,0],[0,0,1],[1,0,0]],tx:-.266,ty:-1.978,tz:.4,rx:.147,ry:.446,rz:.137,s:.079},mir:0}      // tay phải trên màn hình: lớn, gần, ngửa lên
];
const HD=(()=>{
 const mm=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j])),
  rX=a=>[[1,0,0],[0,Math.cos(a),-Math.sin(a)],[0,Math.sin(a),Math.cos(a)]],rY=a=>[[Math.cos(a),0,Math.sin(a)],[0,1,0],[-Math.sin(a),0,Math.cos(a)]],rZ=a=>[[Math.cos(a),-Math.sin(a),0],[Math.sin(a),Math.cos(a),0],[0,0,1]];
 const makeHand=(P=>{
 const mn=Math.min,mx=Math.max,hyp=Math.hypot,sqrt=Math.sqrt;
 const smin=(a,b,k)=>{const h=mx(k-Math.abs(a-b),0)/k;return mn(a,b)-h*h*k*.25};
 const cone=(x,y,z,a,b,ra,rb)=>{const bx=b[0]-a[0],by=b[1]-a[1],bz=b[2]-a[2],px=x-a[0],py=y-a[1],pz=z-a[2],
  t=mn(1,mx(0,(px*bx+py*by+pz*bz)/(bx*bx+by*by+bz*bz))),dx=px-bx*t,dy=py-by*t,dz=pz-bz*t;return sqrt(dx*dx+dy*dy+dz*dz)-(ra+(rb-ra)*t)};
 const ell=(x,y,z,c,r)=>{const qx=x-c[0],qy=y-c[1],qz=z-c[2],k0=sqrt((qx/r[0])**2+(qy/r[1])**2+(qz/r[2])**2),k1=sqrt((qx/(r[0]*r[0]))**2+(qy/(r[1]*r[1]))**2+(qz/(r[2]*r[2]))**2);return k1<1e-9?-mn(r[0],r[1],r[2]):k0*(k0-1)/k1};
 const box=(x,y,z,c,h,r)=>{const qx=Math.abs(x-c[0])-h[0],qy=Math.abs(y-c[1])-h[1],qz=Math.abs(z-c[2])-h[2];
  return sqrt(mx(qx,0)**2+mx(qy,0)**2+mx(qz,0)**2)+mn(mx(qx,mx(qy,qz)),0)-r};
 const chain=(o,L,dirs,r)=>{const J=[o];let p=o;for(let j=0;j<L.length;j++){const d=dirs[j];p=[p[0]+d[0]*L[j],p[1]+d[1]*L[j],p[2]+d[2]*L[j]];J.push(p)}
  const c=[0,0,0];J.forEach(q=>{c[0]+=q[0]/J.length;c[1]+=q[1]/J.length;c[2]+=q[2]/J.length});
  let br=0;J.forEach(q=>br=mx(br,hyp(q[0]-c[0],q[1]-c[1],q[2]-c[2])));return{J,r,c,br:br+r[0]+.3}};
 const FG=P.fingers.map(f=>{let ang=0;const dirs=f.a.map((a,j)=>{ang+=a;const yw=f.yaw*(j?.5:1);return[Math.sin(yw)*Math.cos(ang),Math.cos(yw)*Math.cos(ang),Math.sin(ang)]});
  const r=f.r;return chain([f.x,f.y,-.1],f.L,dirs,[r,r*.92,r*.84,r*.72])});
 const TH=chain(P.thumb.o,P.thumb.L,P.thumb.a.map(([ya,pi])=>[Math.sin(ya)*Math.cos(pi),Math.cos(ya)*Math.cos(pi),Math.sin(pi)]),P.thumb.r);
 const part=(c,x,y,z)=>{let q=1e9;const J=c.J,r=c.r;for(let j=0;j<J.length-1;j++)q=mn(q,cone(x,y,z,J[j],J[j+1],r[j],r[j+1]));return q};
 const near=(c,x,y,z)=>hyp(x-c.c[0],y-c.c[1],z-c.c[2])-c.br;
 function sdf(x,y,z){
  let d=cone(x,y,z*1.45,[0,-4.6,0],[0,.8,0],P.wr[0],P.wr[1]);
  d=smin(d,box(x,y,z,[0,5.1,-.15],[3.0,3.5,.55],1.15),1.6);
  d=smin(d,ell(x,y,z,[2.2,2.9,.7],[2.6,3.4,1.8]),1.4);   // gò ngón cái
  d=smin(d,ell(x,y,z,[-2.6,4.2,.1],[1.6,3.6,1.3]),1.2);   // gò ngón út
  d=-smin(-d,ell(x,y,z,[.2,5.6,3.6+P.cup],[3.0,4.2,2.5]),.9); // lòng bàn tay hơi lõm
  let fd=1e9;for(const f of FG)if(near(f,x,y,z)<d+1)fd=mn(fd,part(f,x,y,z));
  if(fd<1e8)d=smin(d,fd,.55);
  if(near(TH,x,y,z)<d+1.2)d=smin(d,part(TH,x,y,z),.9);
  return mx(d,-(y+4.3))} // cắt phẳng ở cổ tay
 function nrm(x,y,z){const e=.02,a=sdf(x+e,y,z),b=sdf(x,y+e,z),c=sdf(x,y,z+e),d=sdf(x,y,z);return[a-d,b-d,c-d]}
 // lấy mẫu: lưới thô → chỉ lớp sát bề mặt → điểm ngẫu nhiên chiếu về bề mặt → lọc đều (blue-noise)
 function cloud(rc,seed){
  const cs=.8,cand=[];let zs=seed;const rnd=()=>{zs=(zs*1664525+1013904223)>>>0;return zs/4294967296};
  const per=Math.max(2,Math.round(cs*cs*1.5/(rc*rc*.87)*.6));
  for(let X=-8;X<9;X+=cs)for(let Y=-4.5;Y<23;Y+=cs)for(let Z=-7;Z<9;Z+=cs){
   if(Math.abs(sdf(X+cs/2,Y+cs/2,Z+cs/2))>cs*.87)continue;
   for(let i=0;i<per;i++){let px=X+rnd()*cs,py=Y+rnd()*cs,pz=Z+rnd()*cs,d=sdf(px,py,pz);
    for(let it=0;it<3;it++){const g=nrm(px,py,pz),l=hyp(g[0],g[1],g[2])||1,e=.02;px-=g[0]/l*d;py-=g[1]/l*d;pz-=g[2]/l*d;d=sdf(px,py,pz)}
    if(Math.abs(d)>.05)continue;
    const g=nrm(px,py,pz),l=hyp(g[0],g[1],g[2])||1;cand.push([px,py,pz,g[0]/l,g[1]/l,g[2]/l])}}
  const G=new Map(),keep=[],K=(i,j,k)=>((i+600)*1200+(j+600))*1200+(k+600);
  for(let i=cand.length-1;i>0;i--){const j=rnd()*(i+1)|0;const t=cand[i];cand[i]=cand[j];cand[j]=t}
  for(const p of cand){const i=Math.floor(p[0]/rc),j=Math.floor(p[1]/rc),k=Math.floor(p[2]/rc);let ok=1;
   for(let a=-1;a<2&&ok;a++)for(let b=-1;b<2&&ok;b++)for(let c=-1;c<2&&ok;c++){const l=G.get(K(i+a,j+b,k+c));if(l)for(const o of l)if((o[0]-p[0])**2+(o[1]-p[1])**2+(o[2]-p[2])**2<rc*rc){ok=0;break}}
   if(ok){const key=K(i,j,k);(G.get(key)||G.set(key,[]).get(key)).push(p);keep.push(p)}}
  return keep}
 return{sdf,cloud}})(POSE);
 const A=[],ST=[];
HANDS.forEach((h,hi)=>{const T=h.T,M=mm(mm(mm(rY(T.ry),rX(T.rx)),rZ(T.rz)),T.base),pts=makeHand.cloud(HAND.gap/T.s,7+hi*131),mr=h.mir?-1:1;ST.push(A.length);
  for(const p of pts){const x=p[0]*mr*T.s,y=p[1]*T.s,z=p[2]*T.s,nx=p[3]*mr,ny=p[4],nz=p[5],yl=p[1];
   A.push([M[0][0]*x+M[0][1]*y+M[0][2]*z+T.tx,M[1][0]*x+M[1][1]*y+M[1][2]*z+T.ty,M[2][0]*x+M[2][1]*y+M[2][2]*z+T.tz,
    M[0][0]*nx+M[0][1]*ny+M[0][2]*nz,M[1][0]*nx+M[1][1]*ny+M[1][2]*nz,M[2][0]*nx+M[2][1]*ny+M[2][2]*nz,
    yl<-.6?Math.max(0,1+(yl+.6)/3.6):1, // phần cẳng tay mờ dần về 0 ở mặt cắt
    Math.min(1,Math.max(0,(yl+3)/22))])}}); // 0 ở cổ tay → 1 ở đầu ngón (sóng sáng chạy theo)
 const n=A.length,F=()=>new Float32Array(n),X=F(),Y=F(),Z=F(),NX=F(),NY=F(),NZ=F(),Fd=F(),Hh=F();
 A.forEach((a,i)=>{X[i]=a[0];Y[i]=a[1];Z[i]=a[2];NX[i]=a[3];NY[i]=a[4];NZ[i]=a[5];Fd[i]=a[6];Hh[i]=a[7]});
 return{n,h1:ST[1],X,Y,Z,NX,NY,NZ,F:Fd,Hh,PX:F(),PY:F(),PZ:F(),PS:F(),PA:F(),on:true}})();
// chiếu điểm của tay: không xoay 360° như mạng lưới mà chỉ đung đưa nhẹ (HAND.sway) để luôn đọc ra đúng tư thế; camera tay = camera mạng lưới - HAND.tilt, zoom/nghiêng dùng chung
function hProj(T){const ha=1-zz;HD.on=ha>.03;if(!HD.on)return;const hy=HAND.sway*Math.sin(ay*.8),cw=Math.cos(hy),sw=Math.sin(hy),ah=ax-HAND.tilt,ch=Math.cos(ah),sh=Math.sin(ah),L=HAND.light,
 k=W>900?1:.68,wv=((T/3200)%1.6)-.3,bob=.03*Math.sin(T/900),br=.025*Math.sin(T/1400);
 for(let i=0;i<HD.n;i++){const bx=(HD.X[i]+(i<HD.h1?br:-br))*k,by=(HD.Y[i]+bob)*k,bz=HD.Z[i]*k;
  const a0=bx*cw+bz*sw;let c0=-bx*sw+bz*cw;const b0=by*ch-c0*sh;c0=by*sh+c0*ch;
  const a=U[0]*a0+U[1]*b0+U[2]*c0,b=U[3]*a0+U[4]*b0+U[5]*c0,c=U[6]*a0+U[7]*b0+U[8]*c0,s=3.4/(3.4-Math.min(c-FZ,2.5)*.7);
  HD.PX[i]=cx+OX+(a-FX)*ZM*R*s;HD.PY[i]=cy+OY-(b-FY)*ZM*R*s;HD.PZ[i]=c-FZ;
  // pháp tuyến trong hệ camera: lt = độ sáng, fc = hướng về phía người xem
  const nx0=HD.NX[i]*cw+HD.NZ[i]*sw,nz0=-HD.NX[i]*sw+HD.NZ[i]*cw,nb0=HD.NY[i]*ch-nz0*sh,nc0=HD.NY[i]*sh+nz0*ch,nx=U[0]*nx0+U[1]*nb0+U[2]*nc0,nb=U[3]*nx0+U[4]*nb0+U[5]*nc0,nc=U[6]*nx0+U[7]*nb0+U[8]*nc0,lt=Math.max(0,nx*L[0]+nb*L[1]+nc*L[2]),
   dp=D(c-FZ),pu=Math.max(0,1-Math.abs(HD.Hh[i]-wv)*5), // sóng sáng chạy từ cổ tay lên đầu ngón
   vis=nc>-.05?1:.08,rim=Math.max(0,1-Math.abs(nc)/.3)*.3; // mặt khuất chỉ còn mờ nhạt; viền được tô sáng để ra đúng hình bàn tay
  HD.PS[i]=(.7+.8*dp+.8*pu)*Math.min(s,1.6)*(1+(sz-1)*.5);HD.PA[i]=Math.min(1,HD.F[i]*ha*vis*(.14+.5*lt+.22*dp+rim+.45*pu))}}
function hDraw(front){if(!HD.on)return;x.fillStyle='#fff';
 for(let q=0;q<5;q++){x.globalAlpha=(q+.6)/5.2;x.beginPath();let any=0;
  for(let i=0;i<HD.n;i++){if((HD.PZ[i]>=0)!==!!front||HD.PA[i]<.03||Math.min(4,HD.PA[i]*5|0)!==q)continue;x.moveTo(HD.PX[i]+HD.PS[i],HD.PY[i]);x.arc(HD.PX[i],HD.PY[i],HD.PS[i],0,7);any=1}
  if(any)x.fill()}
 x.globalAlpha=1}
// ---- bảng thông tin dự án kiểu bảng điện tử (HUD): bám theo node, có đường nối, hiệu ứng bật CRT + gõ chữ
// INFO (tuỳ chọn): điền thông tin riêng cho từng dự án, ví dụ INFO['Celestia']={desc:'...',url:'https://...',stats:[['TVL','$1B'],['APR','12%'],['NODE','#3']]}
// Thiếu thì tự lấy từ nhóm (Layer 1/2, Cosmos, DA, ZK) và các liên kết trong mạng lưới.
const INFO={};
const LKN={cosmos:'IBC',da:'DA',l2:'Settle',zk:'ZK'},esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let nd=null,ndTok=0,ndW=440,ndH=420,SOUND=true,ac=null;
// âm thanh "pip": WebAudio, không cần file. SOUND=false để tắt hẳn (người dùng cũng bấm ♪ trên bảng để tắt/bật)
const beep=(f,d=.05,v=.04,t0=0)=>{if(!SOUND)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();
 const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+t0;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02)}catch(_){}};
(()=>{const st=document.createElement('style');st.textContent=`
.nd-info{position:fixed;left:0;top:0;z-index:60;display:none;width:28em;max-width:calc(100vw - 16px);box-sizing:border-box;padding-bottom:1em;color:#d6ecff;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:clamp(14px,1.1vw,18px);line-height:1.5;
 background:linear-gradient(180deg,rgba(7,18,36,.95),rgba(3,9,20,.97));border:1px solid var(--c);box-shadow:inset 0 0 32px -12px var(--c),0 0 30px -6px var(--c),0 16px 50px rgba(0,0,0,.6);animation:ndOn .6s cubic-bezier(.2,.8,.2,1) both;overflow:hidden}
.nd-info::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);z-index:2}
.nd-info::after{content:"";position:absolute;left:0;right:0;height:3.4em;top:-3.4em;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(255,255,255,.07),transparent);animation:ndScan 3.6s linear infinite;z-index:2}
.rv{visibility:hidden}.rv.on{visibility:visible;animation:ndRow .3s both}
.nd-cor{position:absolute;inset:3px;pointer-events:none;z-index:3;background:
 linear-gradient(var(--c),var(--c)) 0 0/14px 2px,linear-gradient(var(--c),var(--c)) 0 0/2px 14px,
 linear-gradient(var(--c),var(--c)) 100% 0/14px 2px,linear-gradient(var(--c),var(--c)) 100% 0/2px 14px,
 linear-gradient(var(--c),var(--c)) 0 100%/14px 2px,linear-gradient(var(--c),var(--c)) 0 100%/2px 14px,
 linear-gradient(var(--c),var(--c)) 100% 100%/14px 2px,linear-gradient(var(--c),var(--c)) 100% 100%/2px 14px;background-repeat:no-repeat}
.nd-h{display:flex;align-items:center;gap:.6em;padding:.55em .8em;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.025);font-size:.78em;letter-spacing:.16em;text-transform:uppercase;color:var(--c)}
.nd-led{width:.6em;height:.6em;border-radius:50%;background:var(--c);box-shadow:0 0 8px var(--c);animation:ndB 1.2s infinite;flex:none}
.nd-s,.nd-x{cursor:pointer;color:#9fb8d2;line-height:1;padding:0 .3em;user-select:none}.nd-s{margin-left:auto;font-size:1.2em}.nd-x{font-size:1.5em}.nd-s:hover,.nd-x:hover{color:#fff}.nd-s.off{opacity:.4;text-decoration:line-through}
.nd-t{display:flex;gap:.9em;align-items:center;padding:1em 1em .4em}
.nd-t img{width:4em;height:4em;border-radius:50%;object-fit:contain;background:#0b1220;border:2px solid var(--c);box-shadow:0 0 16px -2px var(--c);flex:none}
.nd-t h3{margin:0;font-family:inherit;font-weight:600;font-size:1.65em;line-height:1.15;letter-spacing:.03em;color:#fff;text-shadow:0 0 14px var(--c)}
.nd-tag{display:inline-block;margin:.4em .4em 0 0;padding:0 .55em;border:1px solid var(--tc);color:var(--tc);font-size:.8em;letter-spacing:.1em;text-transform:uppercase}
.nd-d{margin:.5em 1em .9em;color:#b4cde6;font-size:1.02em;min-height:3.1em}
.nd-c{display:inline-block;width:.55em;height:1em;margin-left:2px;vertical-align:-.12em;background:var(--c);animation:ndB .7s steps(1) infinite}
.nd-g{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin:0 1em .9em;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1)}
.nd-g>div{background:rgba(5,12,26,.92);padding:.5em .65em;min-width:0}
.nd-g small,.nd-l small{display:block;font-size:.7em;letter-spacing:.14em;text-transform:uppercase;color:#7993ae}
.nd-g b{display:block;font-size:1.3em;font-weight:600;color:var(--c);text-shadow:0 0 10px var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nd-l{margin:0 1em .9em}
.nd-ch{margin:.4em .4em 0 0;padding:.15em .6em;border:1px solid var(--tc);background:transparent;color:#e4f4ff;font:inherit;font-size:.88em;cursor:pointer}
.nd-ch em{font-style:normal;color:var(--tc);margin-left:.4em;font-size:.82em;letter-spacing:.08em}
.nd-ch:hover{background:rgba(255,255,255,.1)}
.nd-b{display:block;margin:0 1em;padding:.7em;text-align:center;text-decoration:none;border:1px solid var(--c);color:var(--c);font-size:.92em;letter-spacing:.14em;text-transform:uppercase}
.nd-b:hover{background:var(--c);color:#04101f}
.nd-f{margin:.8em 1em 0;font-size:.72em;letter-spacing:.12em;color:#6a86a2;text-transform:uppercase}
@keyframes ndOn{0%{opacity:0;transform:scale(1,.02);filter:brightness(4)}30%{opacity:1;transform:scale(1,.02)}60%{transform:scale(1,1.04);filter:brightness(2)}100%{opacity:1;transform:none;filter:none}}
@keyframes ndRow{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
@keyframes ndScan{to{top:100%}}@keyframes ndB{50%{opacity:.25}}
@media(max-width:699px){.nd-info{left:8px!important;right:8px;top:auto!important;bottom:8px;width:auto;max-height:72vh;overflow:auto;font-size:15px}}`;
 document.head.appendChild(st);
 nd=document.createElement('div');nd.className='nd-info';document.body.appendChild(nd);
 nd.addEventListener('pointerenter',()=>{overP=true});nd.addEventListener('pointerleave',()=>{overP=false});
 nd.addEventListener('click',e=>{if(e.target.closest('.nd-x')){closeInfo();return}
  const sd=e.target.closest('.nd-s');if(sd){SOUND=!SOUND;sd.classList.toggle('off',!SOUND);beep(1320,.05,.05);return}
  const b=e.target.closest('.nd-ch');if(b)openInfo(+b.dataset.i)})})();
function closeInfo(){sel=null;overP=false;ndTok++;if(nd)nd.style.display='none'}
// ty = 1 dòng chữ sẽ được gõ lần lượt: a = phần đã gõ, b = phần còn lại (ẩn nhưng vẫn giữ chỗ nên bảng không bị nhảy kích thước)
const ty=(t,cls='',sp=18,tag='span')=>`<${tag} class="ty ${cls}" data-t="${esc(t)}" data-s="${sp}"><span></span><span style="visibility:hidden">${esc(t)}</span></${tag}>`;
function openInfo(i,q){const p=P[i].logo,inf=INFO[p.n]||{},col=p.t[0]?TAG[p.t[0]][1]:'#fde047',seen=new Set(),ln=[];
 for(const[a,b,tg,c]of LK){if(a!==i&&b!==i)continue;const o=a===i?b:a,k=o+tg;if(seen.has(k))continue;seen.add(k);ln.push([o,tg,c])}
 const tags=(p.t.length?p.t.map(t=>[tr(TAG[t][0]),TAG[t][1]]):[[tr(p.sub||'Validator'),col]]).map(([n,c])=>`<span class="nd-tag rv" style="--tc:${c}">${ty(n,'',24)}</span>`).join(''),
  desc=inf.desc||(p.hub?tr('Validator at the center of the network, linked to the projects around it.'):p.t.map(t=>tr(NOTE[t])).join(' ')),
  idx=p.hub?'HUB':String(PR.indexOf(p)+1).padStart(2,'0'),
  stats=(inf.stats||[[tr('TYPE'),tr(p.t[0]?TAG[p.t[0]][0]:(p.sub||'Validator'))],[tr('LINKS'),ln.length],[tr('NODE'),'#'+idx]]).slice(0,3),
  url=inf.url||'projects.html',ext=/^https?:/.test(url);
 nd.style.setProperty('--c',col);nd.dataset.i=i;
 nd.innerHTML=`<i class="nd-cor"></i><div class="nd-h rv"><i class="nd-led"></i>${ty(p.hub?tr('Validator hub'):tr('Project //')+' '+idx,'',22)}<b class="nd-s${SOUND?'':' off'}" title="${esc(tr('Sound on/off'))}">♪</b><b class="nd-x" title="${esc(tr('Close'))}">×</b></div>`+
 `<div class="nd-t rv"><img src="${esc(p.im.src)}" alt=""><div>${ty(p.n,'',30,'h3')}${tags}</div></div>`+
 `<p class="nd-d rv">${ty(desc,'',11)}</p>`+
 `<div class="nd-g rv">${stats.map(([l,v])=>`<div class="rv"><small>${ty(l,'',24)}</small><b>${ty(v,'',30)}</b></div>`).join('')}</div>`+
 (ln.length?`<div class="nd-l rv"><small>${ty(tr('Connected'),'',24)}</small>${ln.map(([o,tg,c])=>`<button type="button" class="nd-ch rv" data-i="${o}" style="--tc:${c}">${ty(P[o].logo.n,'',26)}<em>${esc(tr(LKN[tg]))}</em></button>`).join('')}</div>`:'')+
 `<a class="nd-b rv" href="${esc(url)}"${ext?' target="_blank" rel="noopener"':''}>${ty(tr('Open project page')+' ↗','',22)}</a>`+
 `<div class="nd-f rv">${ty(tr('sys · node link ok')+' · '+ln.length+' '+tr(ln.length===1?'link':'links'),'',16)}</div>`;
 sel=i;nd.style.display='block';nd.style.animation='none';void nd.offsetWidth;nd.style.animation='';
 ndW=nd.offsetWidth||ndW;ndH=nd.offsetHeight||ndH;
 // pip pip khi bảng bật ra, rồi từng dòng chữ chạy lần lượt (mỗi dòng: 1 tiếng pip khi bắt đầu, tick nhẹ khi gõ)
 if(!q){beep(1320,.06,.05);beep(1760,.07,.05,.1)}
 const tok=++ndTok,steps=[...nd.querySelectorAll('.ty')],car=document.createElement('i');car.className='nd-c';let si=0;
 const next=()=>{if(tok!==ndTok)return;if(si>=steps.length){return}
  const el=steps[si++],full=el.dataset.t,sp=+el.dataset.s||18,A=el.firstChild,B=el.lastChild,per=full.length>40?2:1;let r=el.closest('.rv');
  while(r){r.classList.add('on');r=r.parentElement&&r.parentElement.closest('.rv')}
  if(!q)beep(980+(si%4)*140,.035,.03);A.after(car);let k=0;const t0=performance.now();
  // gõ theo thời gian thực (khung hình chậm cũng không kéo dài), tick nhẹ mỗi 3 ký tự
  const tick=()=>{if(tok!==ndTok)return;const n=Math.min(full.length,1+Math.floor((performance.now()-t0)*per/(sp*.5)));if(n!==k){if(Math.floor(n/3)!==Math.floor(k/3))if(!q)beep(2300+(n%5)*90,.012,.012);k=n;A.textContent=full.slice(0,k);B.textContent=full.slice(k)}
   if(k<full.length)setTimeout(tick,16);else setTimeout(next,40)};tick()};
 setTimeout(next,480)}
// ---- kéo chuột để xoay 360° theo mọi hướng (quanh trục màn hình), cuộn chuột để zoom tại vị trí con trỏ
const qm=(a,b)=>[a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
addEventListener('pointerdown',e=>{if(e.target.closest('a,button,.nd-info')||!inMod())return;moved=0;drag=true;lx=e.clientX;ly=e.clientY;mx=e.clientX;my=e.clientY});
addEventListener('pointercancel',()=>{drag=false});
addEventListener('pointerup',e=>{if(!drag)return;drag=false;if(e.pointerType==='touch')setTimeout(()=>{if(!drag){mx=my=-1e3}},2500);
 if(moved>=6||e.target.closest('a,button,.nd-info'))return;
 const h=hit();if(h!==null)openInfo(h);else closeInfo()});
addEventListener('wheel',e=>{if(e.target.closest&&e.target.closest('.nd-info'))return;mx=e.clientX;my=e.clientY;if(!inMod())return;e.preventDefault();
 const d=e.deltaMode===1?e.deltaY*16:e.deltaMode===2?e.deltaY*400:e.deltaY,fz=Math.exp(-Math.max(-120,Math.min(120,d))*.0016),nz=Math.min(14,Math.max(.5,UZt*fz)),k=nz/UZt;
 OXt=(mx-cx)-((mx-cx)-OXt)*k;OYt=(my-cy)-((my-cy)-OYt)*k;UZt=nz},{passive:false});
document.addEventListener('mouseleave',()=>{mx=my=-1e3});
addEventListener('keydown',e=>{if(e.key==='Escape'){zt=0;setNote();closeInfo()}});
// lang.js đổi ngôn ngữ → vẽ lại ghi chú và bảng thông tin (nếu đang mở) bằng ngôn ngữ mới
addEventListener('ap:lang',()=>{setNote();if(sel!==null)openInfo(sel,true)});
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(!drag)return;moved+=Math.abs(e.clientX-lx)+Math.abs(e.clientY-ly);const t=e.pointerType==='touch',gy=(e.clientX-lx)*.0075,gx=t?0:(e.clientY-ly)*.0075;UQ=qm(qm([Math.cos(gx/2),Math.sin(gx/2),0,0],[Math.cos(gy/2),0,Math.sin(gy/2),0]),UQ);const l=Math.hypot(UQ[0],UQ[1],UQ[2],UQ[3]);UQ=UQ.map(v=>v/l);lx=e.clientX;ly=e.clientY});
document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const t=c.dataset.tag;filter=filter===t?null:t;document.querySelectorAll('.chip').forEach(d=>d.classList.toggle('on',d.dataset.tag===filter));setNote()});
document.querySelectorAll('.mode').forEach(c=>c.onclick=()=>{target=+c.dataset.m;B.length=0;zt=0;setNote();document.querySelectorAll('.mode').forEach(d=>d.classList.toggle('on',d===c))});
function rs(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';x.setTransform(dpr,0,0,dpr,0,0);
 const dk=W>900;cx=dk?W*.74:W/2;cy0=dk?H*.52:Math.max(H*.3,150);R=dk?Math.min(W*.17,H*.28):Math.min(W*.37,H*.2)}
cv.style.touchAction='pan-y';
addEventListener('resize',rs);rs();
setInterval(()=>{if(B.length<45){const L=m>.5?LY:SP;B.push({e:rnd()*L.E.length|0,t:0,d:rnd()<.5?1:-1,L:m>.5?1:0})}},90);
function rot(X,Y,Z){let a=X*cyy+Z*sy,b=-X*sy+Z*cyy;X=a;Z=b;a=Y*cxx-Z*sxx;b=Y*sxx+Z*cxx;return[X,a,b]}
function pr(X,Y,Z,o){const q=rot(X,Y,Z),r0=U[0]*q[0]+U[1]*q[1]+U[2]*q[2],r1=U[3]*q[0]+U[4]*q[1]+U[5]*q[2],r2=U[6]*q[0]+U[7]*q[1]+U[8]*q[2],a=(r0-FX)*ZM,b=(r1-FY)*ZM,c=r2-FZ,s=3.4/(3.4-Math.min(c,2.5));o.x=cx+OX+a*R*s;o.y=cy+OY-b*R*s;o.z=c;o.s=s;return o}
function f(T){
 x.clearRect(0,0,W,H);cy=cy0-scrollY;if(cy+R*2.6<0){requestAnimationFrame(f);return}
 m+=(target-m)*.05;const e=m*m*(3-2*m);zz+=(zt-zz)*.08;
 // trạng thái người dùng: chuột trong phạm vi mô hình (hoặc đang kéo / đang trên bảng thông tin) → giữ nguyên; ra ngoài → tự về trạng thái ban đầu
 const dt=Math.min(64,T-Tp),zc=Math.max(UZ,1),inM=Math.abs(mx-cx-OX)<R*1.8*zc&&Math.abs(my-cy-OY)<R*1.9*zc,inside=drag||overP||inM;Tp=T;
 UZ+=(UZt-UZ)*.2;OX+=(OXt-OX)*.2;OY+=(OYt-OY)*.2;
 if(!inside){UZt+=(1-UZt)*.08;OXt*=.92;OYt*=.92;if(Math.abs(UZt-1)<.002)UZt=1;if(Math.abs(OXt)<.3)OXt=0;if(Math.abs(OYt)<.3)OYt=0;
  let[w,qx,qy,qz]=UQ;if(w<0){w=-w;qx=-qx;qy=-qy;qz=-qz}w+=(1-w)*.08;qx*=.92;qy*=.92;qz*=.92;const l=Math.hypot(w,qx,qy,qz);UQ=1-w/l<1e-7?[1,0,0,0]:[w/l,qx/l,qy/l,qz/l]}
 {const[w,qx,qy,qz]=UQ;U=[1-2*(qy*qy+qz*qz),2*(qx*qy-w*qz),2*(qx*qz+w*qy),2*(qx*qy+w*qz),1-2*(qx*qx+qz*qz),2*(qy*qz-w*qx),2*(qx*qz-w*qy),2*(qy*qz+w*qx),1-2*(qx*qx+qy*qy)]}
 SPF+=((inside?(drag||UZ>1.25||sel!==null?0:.15):1)-SPF)*.1;TV+=dt*SPF;
 ay+=.0035*SPF;ax+=((.55-.12*(1-e))-ax)*.01;ax=Math.min(1.1,Math.max(.3,ax));
 sy=Math.sin(ay);cyy=Math.cos(ay);sxx=Math.sin(ax);cxx=Math.cos(ax);
 // camera: zoom vào nhóm đang chọn
 FX=FY=FZ=0;ZM=1;const gc=rot(SC[selG][0]*(1-e),SC[selG][1]*(1-e)+(PL[selG].y-CY)*e,SC[selG][2]*(1-e));
 FX=gc[0]*zz;FY=gc[1]*zz;FZ=gc[2]*zz;ZM=(1+(ZS[selG]*(1-e)+ZL[selG]*e-1)*zz)*UZ;sz=1+(Math.min(ZM,7)-1)*.45;
 const CA=SPIN.map(v=>Math.cos(TV*v*e)),SA=SPIN.map(v=>Math.sin(TV*v*e)),C2=SPIN2.map(v=>Math.cos(TV*v*(1-e))),S2=SPIN2.map(v=>Math.sin(TV*v*(1-e)));
 for(let i=0;i<P.length;i++){const q=P[i],u=q.u,l=q.pl,wx=q.w[0]*CA[l]-q.w[2]*SA[l],wz=q.w[0]*SA[l]+q.w[2]*CA[l],
  ux=u[0]*C2[l]-u[2]*S2[l],uz=u[0]*S2[l]+u[2]*C2[l],k=1+.1*Math.sin(2.2*u[0]+TV*7e-4+l)+.08*Math.sin(2.7*u[1]-TV*5e-4)+.06*Math.sin(2.5*u[2]+TV*6e-4);
  pr((SC[l][0]+SR[l]*ux*k)*(1-e)+wx*e,(SC[l][1]+SR[l]*u[1]*k)*(1-e)+q.w[1]*e,(SC[l][2]+SR[l]*uz*k)*(1-e)+wz*e,S[i])}
 hProj(T);hDraw(0); // bàn tay: nửa phía sau vẽ trước, nửa phía trước vẽ sau cùng (trước logo)
 // vỏ khối cầu (chế độ Spheres)
 if(e<.98)PL.forEach((pl,pi)=>{const hl=filter===pl.k,c=TAG[pl.k][1],o=pr(SC[pi][0],SC[pi][1],SC[pi][2],{}),r=SR[pi]*1.06*R*o.s*ZM;
  const g=x.createRadialGradient(o.x,o.y,r*.3,o.x,o.y,r);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,c);
  x.globalAlpha=(1-e)*(hl?.3:.1);x.fillStyle=g;x.beginPath();x.arc(o.x,o.y,r,0,7);x.fill();
  x.globalAlpha=(1-e)*(hl?.95:.35);x.strokeStyle=c;x.lineWidth=hl?2.2:1;x.stroke()});
 // mặt đĩa (chế độ Layers) + sóng đồng thuận
 const ringPath=(r,y)=>{const o={};x.beginPath();for(let a=0;a<=64;a++){pr(Math.cos(a/64*6.2832)*r,y-CY,Math.sin(a/64*6.2832)*r,o);a?x.lineTo(o.x,o.y):x.moveTo(o.x,o.y)}};
 if(e>.02){PL.forEach(pl=>{const hl=filter===pl.k,c=TAG[pl.k][1];ringPath(pl.r*1.04,pl.y);
  x.globalAlpha=e*(hl?.16:.05);x.fillStyle=c;x.fill();x.globalAlpha=e*(hl?.95:.35);x.strokeStyle=c;x.lineWidth=hl?2.2:1;x.stroke()});
  const rr=(T/2800)%1;ringPath(rr*1.04,0);x.globalAlpha=e*(1-rr)*.8;x.strokeStyle='#fde047';x.lineWidth=2;x.stroke()}
 x.globalAlpha=1;x.lineWidth=1;
 const drawE=(Es,al)=>{if(al<.02)return;for(const[i,j]of Es){const a=S[i],b=S[j];x.globalAlpha=al;x.strokeStyle=`rgba(34,211,238,${.05+.32*D((a.z+b.z)/2)})`;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}};
 drawE(SP.E,1-e);drawE(LY.E,e);
 // liên kết: IBC / settle / DA / ZK
 for(let k=0;k<LK.length;k++){const[i,j,tg,col]=LK[k],a=S[i],b=S[j],hl=filter===tg?1:filter?.2:.6;
  x.globalAlpha=.25+.6*hl;x.strokeStyle=col;x.lineWidth=filter===tg?2.2:1.2;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();
  x.globalAlpha=1;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=10;for(let n=0;n<3;n++){const t=((T/1600+k*.37+n/3)%1);x.beginPath();x.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,3*sz,0,7);x.fill()}x.shadowBlur=0}
 x.lineWidth=1;x.globalAlpha=1;
 // block chạy trên cạnh
 for(let q=B.length-1;q>=0;q--){const p=B[q],Es=(p.L?LY:SP).E,ad=(p.L?LY:SP).adj;p.t+=.03;const[i,j]=Es[p.e],A=p.d>0?i:j,C=p.d>0?j:i;
  if(p.t>=1){P[C].f=1;const nb=ad[C];if(nb&&rnd()<.75){const nx=nb[rnd()*nb.length|0];p.e=nx;p.d=Es[nx][0]===C?1:-1;p.t=0}else B.splice(q,1);continue}
  const a=S[A],c=S[C],px=a.x+(c.x-a.x)*p.t,py=a.y+(c.y-a.y)*p.t,r=(2+2.4*D((a.z+c.z)/2))*sz;
  x.fillStyle='#fff';x.shadowBlur=12;x.shadowColor='#fde047';x.fillRect(px-r/2,py-r/2,r,r)}
 x.shadowBlur=0;
 for(let i=0;i<N;i++){const n=P[i],s=S[i],dp=D(s.z);if(n.logo)continue;n.f*=.93;const pu=.5+.5*Math.sin(T/500+n.ph);
  if(n.v){x.fillStyle='#fde047';x.shadowColor='#fde047';x.shadowBlur=16;x.beginPath();x.arc(s.x,s.y,(2.6+pu)*s.s*(.6+dp)*sz,0,7);x.fill();x.shadowBlur=0;
   x.strokeStyle=`rgba(253,224,71,${.35*dp})`;x.beginPath();x.arc(s.x,s.y,(7+pu*6)*s.s*sz,0,7);x.stroke()}
  else{const g=n.f;x.fillStyle=g>.05?`rgba(255,255,255,${.6+g*.4})`:`rgba(165,243,252,${.25+.75*dp})`;x.beginPath();x.arc(s.x,s.y,(1.2+dp*1.2+g*2.5)*s.s*sz,0,7);x.fill()}}
 hDraw(1);
 // logo
 const L=LI.slice().sort((a,b)=>S[a].z-S[b].z),ZMo=W<700?.78:1;hov=drag?null:hit();
 for(const i of L){const s=S[i],p=P[i].logo,dp=D(s.z),col=p.t[0]?TAG[p.t[0]][1]:'#fde047',on=!filter||p.hub||p.t.includes(filter),h=hov===i;
  const r=(p.hub?20:11+13*dp)*ZMo*s.s*sz*(h?1.3:1)*(filter&&on&&!p.hub?1.15:1);
  x.globalAlpha=on?Math.min(1,.3+dp):.08;x.shadowColor=col;x.shadowBlur=on?18:0;x.fillStyle='#0b1220';x.beginPath();x.arc(s.x,s.y,r,0,7);x.fill();x.shadowBlur=0;
  if(p.im.complete&&p.im.naturalWidth){x.save();x.beginPath();x.arc(s.x,s.y,r-2,0,7);x.clip();const q=(r-2)*2,k=Math.max(p.im.naturalWidth,p.im.naturalHeight),w=p.im.naturalWidth/k*q,hh=p.im.naturalHeight/k*q;x.drawImage(p.im,s.x-w/2,s.y-hh/2,w,hh);x.restore()}
  x.strokeStyle=col;x.lineWidth=h?3:2;x.beginPath();x.arc(s.x,s.y,r,0,7);x.stroke();
  if(i===sel){x.globalAlpha=.55;x.lineWidth=1.5;x.beginPath();x.arc(s.x,s.y,r+6+3*Math.sin(T/180),0,7);x.stroke()}}
 x.globalAlpha=1;
 if(hov!==null&&hov!==sel){const s=S[hov],p=P[hov].logo,txt=p.sub?tr(p.sub):p.t.map(t=>tr(TAG[t][0])).join(' • '),col=p.t[0]?TAG[p.t[0]][1]:'#fde047';x.font='600 12px system-ui';
  const w=Math.max(x.measureText(p.n).width,x.measureText(txt).width)+24,bx=Math.min(s.x+22,W-w-8),byy=s.y-30;
  x.fillStyle='rgba(5,11,23,.92)';x.strokeStyle=col;x.lineWidth=1;x.beginPath();x.roundRect(bx,byy,w,46,8);x.fill();x.stroke();x.textAlign='left';x.fillStyle='#fff';x.fillText(p.n,bx+12,byy+19);x.fillStyle=col;x.fillText(txt,bx+12,byy+36)}
 if(sel!==null&&nd){const s=S[sel],pl=P[sel].logo,col=pl.t[0]?TAG[pl.t[0]][1]:'#fde047',rN=(pl.hub?20:11+13*D(s.z))*s.s*sz+6;
  if(W>=700){ndW=nd.offsetWidth||ndW;ndH=nd.offsetHeight||ndH;const right=s.x+rN+36+ndW<W-10,lf=right?s.x+rN+36:Math.max(10,s.x-rN-36-ndW),tp=Math.min(H-ndH-10,Math.max(10,s.y-ndH*.3));
   if(Math.abs((+nd.dataset.px||0)-lf)>.4||Math.abs((+nd.dataset.py||0)-tp)>.4){nd.style.left=lf+'px';nd.style.top=tp+'px';nd.dataset.px=lf;nd.dataset.py=tp}
   const ex=right?lf:lf+ndW,ey=Math.min(tp+ndH-14,Math.max(tp+14,s.y)),ux=right?1:-1;
   x.save();x.strokeStyle=col;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=8;x.globalAlpha=.85;x.lineWidth=1.2;x.setLineDash([5,4]);x.lineDashOffset=-T/40;
   x.beginPath();x.moveTo(s.x+ux*rN,s.y);x.lineTo(ex-ux*14,s.y);x.lineTo(ex,ey);x.stroke();x.setLineDash([]);x.fillRect(ex-2.5,ey-2.5,5,5);x.restore()}}
 document.body.style.cursor=inM&&!overP?(drag?'grabbing':hov!==null?'pointer':'grab'):'';
 requestAnimationFrame(f)}
setNote(); // hiện hướng dẫn đúng ngay từ đầu (HTML có thể còn dòng mặc định cũ)
requestAnimationFrame(f);
})();
