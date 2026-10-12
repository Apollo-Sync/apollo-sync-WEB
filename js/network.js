// Khối cầu 3D: mỗi chấm = 1 node blockchain, nối với node gần nhất, block chạy trên các cạnh
(()=>{
const cv=document.getElementById('net'),x=cv.getContext('2d');
const N=480,K=3,rnd=Math.random;
let W,H,dpr,cx,cy,R;
// node phân bố đều trên cầu (Fibonacci)
const P=[];
for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),t=i*2.39996323;
 P.push({u:[Math.cos(t)*r,y,Math.sin(t)*r],v:i%14===0,ph:rnd()*6.28,f:0,adj:[]})}
// cạnh: mỗi node nối K node gần nhất
const E=[],seen=new Set();
for(let i=0;i<N;i++){
 const d=P.map((q,j)=>[j,(P[i].u[0]-q.u[0])**2+(P[i].u[1]-q.u[1])**2+(P[i].u[2]-q.u[2])**2]).filter(a=>a[0]!==i).sort((a,b)=>a[1]-b[1]).slice(0,K);
 for(const[j]of d){const k=i<j?i+'-'+j:j+'-'+i;if(seen.has(k))continue;seen.add(k);
  E.push([i,j]);P[i].adj.push(E.length-1);P[j].adj.push(E.length-1)}}
const S=P.map(()=>({x:0,y:0,z:0,s:1}));
// tương tác kéo để xoay
let ay=0,ax=.35,vy=.0035,vx=0,drag=false,lx=0,ly=0;
addEventListener('pointerdown',e=>{if(e.target.closest('a,button'))return;drag=true;lx=e.clientX;ly=e.clientY});
addEventListener('pointerup',()=>drag=false);
addEventListener('pointermove',e=>{if(!drag)return;vy=(e.clientX-lx)*.0006;vx=(e.clientY-ly)*.0006;ay+=(e.clientX-lx)*.006;ax+=(e.clientY-ly)*.006;lx=e.clientX;ly=e.clientY});
function rs(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;cv.style.width=W+'px';cv.style.height=H+'px';
 x.setTransform(dpr,0,0,dpr,0,0);cx=W>900?W*.68:W/2;cy=H*.5;R=Math.min(W>900?W*.3:W*.42,H*.38)}
addEventListener('resize',rs);rs();
// block chạy trên cạnh
const B=[];
setInterval(()=>{if(B.length<45)B.push({e:Math.random()*E.length|0,t:0,d:rnd()<.5?1:-1})},90);
function f(T){
 x.clearRect(0,0,W,H);
 if(!drag){ay+=vy;ax+=vx;vx*=.95;vy+=(.0035-vy)*.02;ax+=(.35-ax)*.002}
 const sy=Math.sin(ay),cyy=Math.cos(ay),sx=Math.sin(ax),cxx=Math.cos(ax);
 const fade=Math.max(.2,1-scrollY/(H*.9));
 x.globalAlpha=fade;
 for(let i=0;i<N;i++){const u=P[i].u;
  // khối hơi "biến dạng" như blob, thở nhẹ
  const k=1+.12*Math.sin(2.2*u[0]+T*7e-4)+.1*Math.sin(2.7*u[1]-T*5e-4)+.08*Math.sin(2.5*u[2]+T*6e-4);
  let X=u[0]*k,Y=u[1]*k,Z=u[2]*k;
  let a=X*cyy+Z*sy,b=-X*sy+Z*cyy;X=a;Z=b;
  a=Y*cxx-Z*sx;b=Y*sx+Z*cxx;Y=a;Z=b;
  const s=3.4/(3.4-Z);S[i].x=cx+X*R*s;S[i].y=cy+Y*R*s;S[i].z=Z;S[i].s=s}
 x.lineWidth=1;
 for(const[i,j]of E){const a=S[i],b=S[j],d=(a.z+b.z)/2;
  x.strokeStyle=`rgba(34,211,238,${.05+.32*(d+1.2)/2.4})`;
  x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke()}
 // block di chuyển
 for(let q=B.length-1;q>=0;q--){const p=B[q];p.t+=.03;
  const[i,j]=E[p.e],A=p.d>0?i:j,C=p.d>0?j:i;
  if(p.t>=1){P[C].f=1;
   if(rnd()<.75){const nx=P[C].adj[Math.random()*P[C].adj.length|0];p.e=nx;p.d=E[nx][0]===C?1:-1;p.t=0}else B.splice(q,1);continue}
  const a=S[A],c=S[C],px=a.x+(c.x-a.x)*p.t,py=a.y+(c.y-a.y)*p.t,z=a.z+(c.z-a.z)*p.t;
  x.fillStyle='#fff';x.shadowBlur=12;x.shadowColor='#fde047';
  const r=2+1.2*(z+1);x.fillRect(px-r/2,py-r/2,r,r)}
 x.shadowBlur=0;
 // vẽ node
 for(let i=0;i<N;i++){const n=P[i],s=S[i],dp=(s.z+1.3)/2.6;n.f*=.93;
  const pu=.5+.5*Math.sin(T/500+n.ph);
  if(n.v){x.fillStyle='#fde047';x.shadowColor='#fde047';x.shadowBlur=16;
   x.beginPath();x.arc(s.x,s.y,(2.6+pu)*s.s*(.6+dp),0,7);x.fill();x.shadowBlur=0;
   x.strokeStyle=`rgba(253,224,71,${.35*dp})`;x.beginPath();x.arc(s.x,s.y,(7+pu*6)*s.s,0,7);x.stroke()}
  else{const g=n.f;x.fillStyle=g>.05?`rgba(255,255,255,${.6+g*.4})`:`rgba(165,243,252,${.25+.75*dp})`;
   x.beginPath();x.arc(s.x,s.y,(1.2+dp*1.2+g*2.5)*s.s,0,7);x.fill()}}
 x.globalAlpha=1;requestAnimationFrame(f)}
requestAnimationFrame(f);
})();
