// Mỗi chấm = 1 node. Chế độ 0: khối cầu tổng quan. Chế độ 1: kiến trúc phân tầng (L2 / ZK / L1 / DA) + IBC của Cosmos
(()=>{
const cv=document.getElementById('net'),x=cv.getContext('2d'),rnd=Math.random;
const N=480,K=3,CY=.15;
const TAG={l1:['Layer 1','#22d3ee'],l2:['Layer 2','#c084fc'],cosmos:['Cosmos','#60a5fa'],da:['Modular / DA','#34d399'],zk:['ZK','#fb923c']};
const PL=[{k:'l2',y:1,r:.8,l:'LAYER 2 · ROLLUP'},{k:'zk',y:.5,r:.6,l:'ZK · XÁC THỰC PROOF'},{k:'l1',y:0,r:1,l:'LAYER 1 · ĐỒNG THUẬN'},{k:'da',y:-.75,r:.8,l:'DATA AVAILABILITY'}];
const NOTE={none:'Kéo để xoay • rê chuột vào logo để xem chi tiết • bấm loại để xem cách chúng kết nối.',
l1:'Layer 1: blockchain gốc, có đồng thuận và bộ validator riêng. ApolloSYNC vận hành validator ở tầng này.',
l2:'Layer 2 / Rollup: thực thi giao dịch bên trên, ghi kết quả về L1 (đường tím) để thừa hưởng bảo mật.',
cosmos:'Cosmos: mạng các chain độc lập nối với nhau bằng giao thức IBC (đường xanh dương trên tầng L1).',
da:'Data Availability: lớp lưu dữ liệu cho rollup, dữ liệu đi xuống (đường xanh lá).',
zk:'ZK: bằng chứng mật mã chứng minh giao dịch hợp lệ, đi lên L1 để xác thực (đường cam).'};
const PR=[['DYDX','DYDX',['cosmos','l1']],['Celestia','CELESTIA',['da','cosmos']],['Nibiru','NIBIRU',['cosmos','l1']],['Pactus','PACTUS',['l1']],['ZetaChain','ZETACHAIN',['l1','cosmos']],
['Warden','WARDEN',['cosmos','l1']],['AirChains','AIRCHAINS',['l2','zk']],['Pryzm','PRYZM',['cosmos']],['Initia','INITIA',['l1','cosmos']],['Self Chain','SELF-CHAIN',['cosmos','l1']],
['Shardeum','SHARDEUM',['l1']],['Namada','NAMADA',['l1']],['Aligned Layer','ALIGNED-LAYER',['zk']],['Dymension','DYMENSION',['l2','cosmos']],['Avail','AVAIL',['da']],['0G Labs','OG-LAB',['l1']],['MANTRA','MANTRA',['cosmos','l1']]]
.map(([n,f,t])=>{const im=new Image();im.src='assets/Projectlogos/'+f+'.png';return{n,t,im}});
const hubIm=new Image();hubIm.src='assets/logo.jpg';
let filter=null,mx=-1e3,my=-1e3,hov=null,moved=0,m=1,target=1;
// ---- node + tọa độ ở 2 chế độ
const P=[];
for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),t=i*2.39996323;
 P.push({u:[Math.cos(t)*r,y,Math.sin(t)*r],v:i%14===0,ph:rnd()*6.28,f:0,pl:[2,2,2,2,2,0,0,1,3,3][i%10]})}
PR.forEach((p,k)=>{const i=Math.round((k+.5)*N/PR.length);P[i].logo=p;P[i].v=false;p.i=i});
const by=n=>PR.find(p=>p.n===n);
const HUB=N;P.push({u:[0,0,0],v:false,ph:0,f:0,pl:2,logo:{n:'ApolloSYNC',t:[],im:hubIm,sub:'Validator • bảo mật các chain L1',hub:true},i:N});
// vị trí logo ở chế độ phân tầng
const ring=['DYDX','Nibiru','ZetaChain','Warden','Pryzm','Initia','Self Chain','MANTRA','Pactus','Shardeum','Namada','0G Labs'];
const FIX={'AirChains':[0,-.35,.1],'Dymension':[0,.35,-.1],'Aligned Layer':[1,0,.28],'Celestia':[3,-.4,0],'Avail':[3,.4,0]};
for(const p of PR){const q=P[p.i];if(FIX[p.n]){q.pl=FIX[p.n][0];q.w=[FIX[p.n][1],PL[q.pl].y-CY,FIX[p.n][2]]}}
ring.forEach((n,k)=>{const q=P[by(n).i],a=k/ring.length*6.2832;q.pl=2;q.w=[Math.cos(a)*.68,-CY,Math.sin(a)*.68]});
P[HUB].w=[0,-CY,0];
PL.forEach((pl,pi)=>{const g=P.filter(q=>q.pl===pi&&!q.w);g.forEach((q,k)=>{const a=k*2.39996,r=pl.r*Math.sqrt((k+.5)/g.length);q.w=[Math.cos(a)*r,pl.y-CY,Math.sin(a)*r]})});
// cạnh: sphere kNN / từng tầng kNN
function knn(ids,pos){const E=[],seen=new Set(),adj={};ids.forEach(i=>adj[i]=[]);
 for(const i of ids){const d=ids.filter(j=>j!==i).map(j=>[j,pos(i).reduce((s,v,a)=>s+(v-pos(j)[a])**2,0)]).sort((a,b)=>a[1]-b[1]).slice(0,K);
  for(const[j]of d){const k=i<j?i+'-'+j:j+'-'+i;if(seen.has(k))continue;seen.add(k);E.push([i,j]);adj[i].push(E.length-1);adj[j].push(E.length-1)}}return{E,adj}}
const idsS=[...Array(N).keys()],SP=knn(idsS,i=>P[i].u);
let EL=[],AL={};PL.forEach((_,pi)=>{const ids=P.map((q,i)=>q.pl===pi?i:-1).filter(i=>i>=0),r=knn(ids,i=>P[i].w),o=EL.length;
 r.E.forEach(e=>EL.push(e));for(const i in r.adj)AL[i]=r.adj[i].map(e=>e+o)});
// liên kết đặc biệt (chế độ phân tầng)
const I=n=>by(n).i,cosm=ring.filter(n=>by(n).t.includes('cosmos'));
const LK=[];
cosm.forEach((n,k)=>LK.push([I(n),I(cosm[(k+1)%cosm.length]),'cosmos','#60a5fa']));
LK.push([I('Celestia'),I('Avail'),'da','#34d399']);
[['AirChains'],['Dymension']].forEach(([n])=>{LK.push([I(n),HUB,'l2','#c084fc'],[I(n),I('Celestia'),'da','#34d399'],[I(n),I('Avail'),'da','#34d399']);});
LK.push([I('AirChains'),I('Aligned Layer'),'zk','#fb923c'],[I('Aligned Layer'),HUB,'zk','#fb923c']);
const S=P.map(()=>({x:0,y:0,z:0,s:1})),B=[];
let W,H,dpr,cx,cy,R,ay=0,ax=.5,vy=.0035,vx=0,drag=false,lx=0,ly=0;
let prev=null,touch=false;
addEventListener('pointerdown',e=>{if(e.target.closest('a,button'))return;touch=e.pointerType==='touch';prev=hov;moved=0;drag=true;lx=e.clientX;ly=e.clientY;mx=e.clientX;my=e.clientY});
addEventListener('pointercancel',()=>{drag=false});
addEventListener('pointerup',e=>{drag=false;if(hov!==null&&moved<6&&!P[hov].logo.hub&&!e.target.closest('a,button')&&(!touch||prev===hov))location.href='projects.html'});
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(!drag)return;moved+=Math.abs(e.clientX-lx)+Math.abs(e.clientY-ly);vy=(e.clientX-lx)*.0006;vx=(e.clientY-ly)*.0006;ay+=(e.clientX-lx)*.006;if(!touch)ax+=(e.clientY-ly)*.006;lx=e.clientX;ly=e.clientY});
const note=document.getElementById('note');
document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const t=c.dataset.tag;filter=filter===t?null:t;document.querySelectorAll('.chip').forEach(d=>d.classList.toggle('on',d.dataset.tag===filter));if(note)note.textContent=NOTE[filter||'none']});
document.querySelectorAll('.mode').forEach(c=>c.onclick=()=>{target=+c.dataset.m;B.length=0;document.querySelectorAll('.mode').forEach(d=>d.classList.toggle('on',d===c))});
function rs(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';x.setTransform(dpr,0,0,dpr,0,0);const dk=W>900;cx=dk?W*.68:W/2;cy=dk?H*.5:Math.max(H*.3,150);R=dk?Math.min(W*.3,H*.36):Math.min(W*.4,H*.22)}
addEventListener('resize',rs);rs();
setInterval(()=>{if(B.length<45){const L=m>.5?EL:SP.E;B.push({e:rnd()*L.length|0,t:0,d:rnd()<.5?1:-1,L:m>.5?1:0})}},90);
let sy,cyy,sx,cxx;
function pr(X,Y,Z,o){let a=X*cyy+Z*sy,b=-X*sy+Z*cyy;X=a;Z=b;a=Y*cxx-Z*sx;b=Y*sx+Z*cxx;Y=a;Z=b;const s=3.4/(3.4-Z);o.x=cx+X*R*s;o.y=cy+Y*R*s;o.z=Z;o.s=s;return o}
function f(T){
 x.clearRect(0,0,W,H);m+=(target-m)*.05;const e=m*m*(3-2*m);
 if(!drag){ay+=vy;ax+=vx;vx*=.95;vy+=(.0035-vy)*.02;ax+=((.5-.15*(1-e))-ax)*.002}
 sy=Math.sin(ay);cyy=Math.cos(ay);sx=Math.sin(ax);cxx=Math.cos(ax);
 const fade=Math.max(.12,1-scrollY/(H*(W>900?.9:.5)));x.globalAlpha=fade;
 for(let i=0;i<P.length;i++){const q=P[i],u=q.u,k=1+.12*Math.sin(2.2*u[0]+T*7e-4)+.1*Math.sin(2.7*u[1]-T*5e-4)+.08*Math.sin(2.5*u[2]+T*6e-4);
  pr(u[0]*k*(1-e)+q.w[0]*e,u[1]*k*(1-e)+q.w[1]*e,u[2]*k*(1-e)+q.w[2]*e,S[i])}
 // viền các tầng + nhãn
 if(e>.02)PL.forEach(pl=>{const hl=filter===pl.k,o={};x.strokeStyle=TAG[pl.k][1];x.lineWidth=hl?2:1;x.globalAlpha=fade*e*(hl?.9:.3);x.beginPath();
  for(let a=0;a<=64;a++){pr(Math.cos(a/64*6.2832)*pl.r*1.04,pl.y-CY,Math.sin(a/64*6.2832)*pl.r*1.04,o);a?x.lineTo(o.x,o.y):x.moveTo(o.x,o.y)}x.stroke();
  pr(pl.r*1.08,pl.y-CY,0,o);x.globalAlpha=fade*e*(.35+.65*(o.z+1)/2);x.fillStyle=TAG[pl.k][1];x.font='700 10px system-ui';x.textAlign='left';x.fillText(pl.l,o.x+4,o.y)});
 // cạnh
 x.lineWidth=1;
 const drawE=(Es,al)=>{if(al<.02)return;for(const[i,j]of Es){const a=S[i],b=S[j],d=(a.z+b.z)/2;x.globalAlpha=fade*al;x.strokeStyle=`rgba(34,211,238,${.05+.32*(d+1.2)/2.4})`;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}};
 drawE(SP.E,1-e);drawE(EL,e);
 // liên kết đặc biệt: IBC (cosmos), settle (l2), DA, ZK
 if(e>.02)for(let k=0;k<LK.length;k++){const[i,j,tg,col]=LK[k],a=S[i],b=S[j],hl=filter===tg?1:filter?.2:.6;
  x.globalAlpha=fade*e*(.25+.6*hl);x.strokeStyle=col;x.lineWidth=filter===tg?2.2:1.2;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();
  const t=((T/1600+k*.37)%1);x.globalAlpha=fade*e;x.fillStyle=col;x.shadowColor=col;x.shadowBlur=10;x.beginPath();x.arc(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,3,0,7);x.fill();x.shadowBlur=0}
 x.lineWidth=1;x.globalAlpha=fade;
 // block chạy
 for(let q=B.length-1;q>=0;q--){const p=B[q],Es=p.L?EL:SP.E,ad=p.L?AL:SP.adj;p.t+=.03;const[i,j]=Es[p.e],A=p.d>0?i:j,C=p.d>0?j:i;
  if(p.t>=1){P[C].f=1;const nb=ad[C];if(nb&&rnd()<.75){const nx=nb[rnd()*nb.length|0];p.e=nx;p.d=Es[nx][0]===C?1:-1;p.t=0}else B.splice(q,1);continue}
  const a=S[A],c=S[C],px=a.x+(c.x-a.x)*p.t,py=a.y+(c.y-a.y)*p.t,r=2+1.2*((a.z+c.z)/2+1);
  x.fillStyle='#fff';x.shadowBlur=12;x.shadowColor='#fde047';x.fillRect(px-r/2,py-r/2,r,r)}
 x.shadowBlur=0;
 // node
 for(let i=0;i<N;i++){const n=P[i],s=S[i],dp=(s.z+1.3)/2.6;if(n.logo)continue;n.f*=.93;const pu=.5+.5*Math.sin(T/500+n.ph);
  if(n.v){x.fillStyle='#fde047';x.shadowColor='#fde047';x.shadowBlur=16;x.beginPath();x.arc(s.x,s.y,(2.6+pu)*s.s*(.6+dp),0,7);x.fill();x.shadowBlur=0;
   x.strokeStyle=`rgba(253,224,71,${.35*dp})`;x.beginPath();x.arc(s.x,s.y,(7+pu*6)*s.s,0,7);x.stroke()}
  else{const g=n.f;x.fillStyle=g>.05?`rgba(255,255,255,${.6+g*.4})`:`rgba(165,243,252,${.25+.75*dp})`;x.beginPath();x.arc(s.x,s.y,(1.2+dp*1.2+g*2.5)*s.s,0,7);x.fill()}}
 // logo
 const ZM=W<700?.78:1;
 const L=PR.map(p=>p.i).concat(HUB).sort((a,b)=>S[a].z-S[b].z);hov=null;let best=26;
 for(const i of L){const s=S[i],d=Math.hypot(s.x-mx,s.y-my);if(s.z>-.3&&d<best&&!drag){best=d;hov=i}}
 for(const i of L){const s=S[i],p=P[i].logo,dp=(s.z+1.3)/2.6,col=p.t[0]?TAG[p.t[0]][1]:'#fde047',on=!filter||p.hub||p.t.includes(filter),h=hov===i;
  const r=(p.hub?20:11+13*dp)*ZM*s.s*(h?1.35:1)*(filter&&on&&!p.hub?1.2:1);
  x.globalAlpha=fade*(on?Math.min(1,.3+dp):.08);x.shadowColor=col;x.shadowBlur=on?18:0;x.fillStyle='#0b1220';x.beginPath();x.arc(s.x,s.y,r,0,7);x.fill();x.shadowBlur=0;
  if(p.im.complete&&p.im.naturalWidth){x.save();x.beginPath();x.arc(s.x,s.y,r-2,0,7);x.clip();const q=(r-2)*2,k=Math.max(p.im.naturalWidth,p.im.naturalHeight),w=p.im.naturalWidth/k*q,hh=p.im.naturalHeight/k*q;x.drawImage(p.im,s.x-w/2,s.y-hh/2,w,hh);x.restore()}
  x.strokeStyle=col;x.lineWidth=h?3:2;x.beginPath();x.arc(s.x,s.y,r,0,7);x.stroke();
  if(s.z>.1&&on){x.globalAlpha=fade*Math.min(1,dp+.1);x.fillStyle='#e2e8f0';x.font='600 11px system-ui';x.textAlign='center';x.fillText(p.n,s.x,s.y+r+13)}}
 x.globalAlpha=1;
 if(hov!==null){const s=S[hov],p=P[hov].logo,txt=p.sub||p.t.map(t=>TAG[t][0]).join(' • ');x.font='600 12px system-ui';const w=Math.max(x.measureText(p.n).width,x.measureText(txt).width)+24,bx=Math.min(s.x+22,W-w-8),byy=s.y-30,col=p.t[0]?TAG[p.t[0]][1]:'#fde047';
  x.fillStyle='rgba(5,11,23,.92)';x.strokeStyle=col;x.lineWidth=1;x.beginPath();x.roundRect(bx,byy,w,46,8);x.fill();x.stroke();x.textAlign='left';x.fillStyle='#fff';x.fillText(p.n,bx+12,byy+19);x.fillStyle=col;x.fillText(txt,bx+12,byy+36)}
 document.body.style.cursor=hov!==null&&!P[hov].logo.hub?'pointer':'';
 requestAnimationFrame(f)}
requestAnimationFrame(f);
})();
