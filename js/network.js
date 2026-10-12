// Mỗi chấm = 1 node. "Spheres": mỗi loại là 1 khối cầu riêng. "Layers": 4 tầng xếp chồng. Bấm vào 1 nhóm để phóng to.
(()=>{
const cv=document.getElementById('net'),x=cv.getContext('2d'),rnd=Math.random;
const N=480,K=3,CY=.15,D=z=>Math.min(1,Math.max(0,(z+1.3)/2.6));
const TAG={l1:['Layer 1','#22d3ee'],l2:['Layer 2','#c084fc'],cosmos:['Cosmos','#60a5fa'],da:['Modular / DA','#34d399'],zk:['ZK','#fb923c']};
const PL=[{k:'l2',y:1,r:.8},{k:'zk',y:.5,r:.6},{k:'l1',y:0,r:1},{k:'da',y:-.75,r:.8}];
const SPIN=[.0003,-.0005,.0002,-.0003],SPIN2=[.0005,-.0007,.0003,-.0005];
const SC=[[0,.85,0],[.85,.3,.1],[0,-.02,0],[0,-.85,0]],SR=[.26,.22,.46,.28];
const ZS=[3,3.3,1.9,3],ZL=[2.2,2.8,1.5,2.2];
const NOTE={none:'Drag to rotate. Click a group to zoom.',l1:'Base chains with their own validators.',l2:'Rollups that settle on Layer 1.',cosmos:'Sovereign chains linked by IBC.',da:'Where rollups publish their data.',zk:'Proofs sent up to Layer 1.',zoom:'Click a logo to open it. Click elsewhere to zoom out.'};
const PR=[['DYDX','DYDX',['cosmos','l1']],['Celestia','CELESTIA',['da','cosmos']],['Nibiru','NIBIRU',['cosmos','l1']],['Pactus','PACTUS',['l1']],['ZetaChain','ZETACHAIN',['l1','cosmos']],
['Warden','WARDEN',['cosmos','l1']],['AirChains','AIRCHAINS',['l2','zk']],['Pryzm','PRYZM',['cosmos']],['Initia','INITIA',['l1','cosmos']],['Self Chain','SELF-CHAIN',['cosmos','l1']],
['Shardeum','SHARDEUM',['l1']],['Namada','NAMADA',['l1']],['Aligned Layer','ALIGNED-LAYER',['zk']],['Dymension','DYMENSION',['l2','cosmos']],['Avail','AVAIL',['da']],['0G Labs','OG-LAB',['l1']],['MANTRA','MANTRA',['cosmos','l1']]]
.map(([n,f,t])=>{const im=new Image();im.src='assets/Projectlogos/'+f+'.png';return{n,t,im}});
const hubIm=new Image();hubIm.src='assets/logo.jpg';
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
const note=document.getElementById('note'),setNote=()=>{if(note)note.textContent=zt?NOTE.zoom:NOTE[filter||'none']};
const hit=()=>{let b=26,r=null;for(const i of LI){const s=S[i],d=Math.hypot(s.x-mx,s.y-my);if(s.z>-.4&&d<b){b=d;r=i}}return r};
addEventListener('pointerdown',e=>{if(e.target.closest('a,button'))return;moved=0;drag=true;lx=e.clientX;ly=e.clientY;mx=e.clientX;my=e.clientY});
addEventListener('pointercancel',()=>{drag=false});
addEventListener('pointerup',e=>{if(!drag)return;drag=false;if(moved>=6||e.target.closest('a,button'))return;
 const h=hit();
 if(zt){if(h!==null&&!P[h].logo.hub)location.href='projects.html';else{zt=0;setNote()}return}
 let g=null;if(h!==null)g=P[h].pl;else{let b=30;for(let i=0;i<P.length;i++){const d=Math.hypot(S[i].x-e.clientX,S[i].y-e.clientY);if(d<b){b=d;g=P[i].pl}}}
 if(g!==null){selG=g;zt=1;setNote()}});
addEventListener('keydown',e=>{if(e.key==='Escape'){zt=0;setNote()}});
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;if(!drag)return;moved+=Math.abs(e.clientX-lx)+Math.abs(e.clientY-ly);const t=e.pointerType==='touch';vy=(e.clientX-lx)*.0006;vx=t?0:(e.clientY-ly)*.0006;ay+=(e.clientX-lx)*.006;if(!t)ax+=(e.clientY-ly)*.006;lx=e.clientX;ly=e.clientY});
document.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const t=c.dataset.tag;filter=filter===t?null:t;document.querySelectorAll('.chip').forEach(d=>d.classList.toggle('on',d.dataset.tag===filter));setNote()});
document.querySelectorAll('.mode').forEach(c=>c.onclick=()=>{target=+c.dataset.m;B.length=0;zt=0;setNote();document.querySelectorAll('.mode').forEach(d=>d.classList.toggle('on',d===c))});
function rs(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';x.setTransform(dpr,0,0,dpr,0,0);
 const dk=W>900;cx=dk?W*.74:W/2;cy0=dk?H*.52:Math.max(H*.3,150);R=dk?Math.min(W*.17,H*.28):Math.min(W*.37,H*.2)}
addEventListener('resize',rs);rs();
setInterval(()=>{if(B.length<45){const L=m>.5?LY:SP;B.push({e:rnd()*L.E.length|0,t:0,d:rnd()<.5?1:-1,L:m>.5?1:0})}},90);
function rot(X,Y,Z){let a=X*cyy+Z*sy,b=-X*sy+Z*cyy;X=a;Z=b;a=Y*cxx-Z*sxx;b=Y*sxx+Z*cxx;return[X,a,b]}
function pr(X,Y,Z,o){const r=rot(X,Y,Z),a=(r[0]-FX)*ZM,b=(r[1]-FY)*ZM,c=r[2]-FZ,s=3.4/(3.4-Math.min(c,2.5));o.x=cx+a*R*s;o.y=cy-b*R*s;o.z=c;o.s=s;return o}
function f(T){
 x.clearRect(0,0,W,H);cy=cy0-scrollY;if(cy+R*2.6<0){requestAnimationFrame(f);return}
 m+=(target-m)*.05;const e=m*m*(3-2*m);zz+=(zt-zz)*.08;
 if(!drag){ay+=vy;ax+=vx;vx*=.95;vy+=(.0035-vy)*.02}ax+=((.55-.12*(1-e))-ax)*(drag?0:.01);ax=Math.min(1.1,Math.max(.3,ax));
 sy=Math.sin(ay);cyy=Math.cos(ay);sxx=Math.sin(ax);cxx=Math.cos(ax);
 // camera: zoom vào nhóm đang chọn
 FX=FY=FZ=0;ZM=1;const gc=rot(SC[selG][0]*(1-e),SC[selG][1]*(1-e)+(PL[selG].y-CY)*e,SC[selG][2]*(1-e));
 FX=gc[0]*zz;FY=gc[1]*zz;FZ=gc[2]*zz;ZM=1+(ZS[selG]*(1-e)+ZL[selG]*e-1)*zz;sz=1+(ZM-1)*.45;
 const CA=SPIN.map(v=>Math.cos(T*v*e)),SA=SPIN.map(v=>Math.sin(T*v*e)),C2=SPIN2.map(v=>Math.cos(T*v*(1-e))),S2=SPIN2.map(v=>Math.sin(T*v*(1-e)));
 for(let i=0;i<P.length;i++){const q=P[i],u=q.u,l=q.pl,wx=q.w[0]*CA[l]-q.w[2]*SA[l],wz=q.w[0]*SA[l]+q.w[2]*CA[l],
  ux=u[0]*C2[l]-u[2]*S2[l],uz=u[0]*S2[l]+u[2]*C2[l],k=1+.1*Math.sin(2.2*u[0]+T*7e-4+l)+.08*Math.sin(2.7*u[1]-T*5e-4)+.06*Math.sin(2.5*u[2]+T*6e-4);
  pr((SC[l][0]+SR[l]*ux*k)*(1-e)+wx*e,(SC[l][1]+SR[l]*u[1]*k)*(1-e)+q.w[1]*e,(SC[l][2]+SR[l]*uz*k)*(1-e)+wz*e,S[i])}
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
 // logo
 const L=LI.slice().sort((a,b)=>S[a].z-S[b].z),ZMo=W<700?.78:1;hov=drag?null:hit();
 for(const i of L){const s=S[i],p=P[i].logo,dp=D(s.z),col=p.t[0]?TAG[p.t[0]][1]:'#fde047',on=!filter||p.hub||p.t.includes(filter),h=hov===i;
  const r=(p.hub?20:11+13*dp)*ZMo*s.s*sz*(h?1.3:1)*(filter&&on&&!p.hub?1.15:1);
  x.globalAlpha=on?Math.min(1,.3+dp):.08;x.shadowColor=col;x.shadowBlur=on?18:0;x.fillStyle='#0b1220';x.beginPath();x.arc(s.x,s.y,r,0,7);x.fill();x.shadowBlur=0;
  if(p.im.complete&&p.im.naturalWidth){x.save();x.beginPath();x.arc(s.x,s.y,r-2,0,7);x.clip();const q=(r-2)*2,k=Math.max(p.im.naturalWidth,p.im.naturalHeight),w=p.im.naturalWidth/k*q,hh=p.im.naturalHeight/k*q;x.drawImage(p.im,s.x-w/2,s.y-hh/2,w,hh);x.restore()}
  x.strokeStyle=col;x.lineWidth=h?3:2;x.beginPath();x.arc(s.x,s.y,r,0,7);x.stroke()}
 x.globalAlpha=1;
 if(hov!==null){const s=S[hov],p=P[hov].logo,txt=p.sub||p.t.map(t=>TAG[t][0]).join(' • '),col=p.t[0]?TAG[p.t[0]][1]:'#fde047';x.font='600 12px system-ui';
  const w=Math.max(x.measureText(p.n).width,x.measureText(txt).width)+24,bx=Math.min(s.x+22,W-w-8),byy=s.y-30;
  x.fillStyle='rgba(5,11,23,.92)';x.strokeStyle=col;x.lineWidth=1;x.beginPath();x.roundRect(bx,byy,w,46,8);x.fill();x.stroke();x.textAlign='left';x.fillStyle='#fff';x.fillText(p.n,bx+12,byy+19);x.fillStyle=col;x.fillText(txt,bx+12,byy+36)}
 const inSt=Math.abs(mx-cx)<R*1.8&&Math.abs(my-cy)<R*1.9;
 document.body.style.cursor=zt?(hov!==null&&!P[hov].logo.hub?'pointer':inSt?'zoom-out':''):(hov!==null||inSt?'zoom-in':'');
 requestAnimationFrame(f)}
requestAnimationFrame(f);
})();
