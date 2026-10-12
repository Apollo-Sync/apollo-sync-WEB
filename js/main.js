// reveal khi cuộn
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// đếm số
const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;co.unobserve(e.target);
 const t=+e.target.dataset.n,s=e.target.dataset.s||'';let i=0;
 const id=setInterval(()=>{i+=Math.max(1,t/30);if(i>=t){i=t;clearInterval(id)}e.target.textContent=Math.round(i)+s},35)}),{threshold:.6});
document.querySelectorAll('[data-n]').forEach(el=>co.observe(el));
// ticker block mô phỏng
const tk=document.getElementById('ticker');
if(tk){let h=1000000+Math.floor(Math.random()*9e6);
 const add=()=>{const d=document.createElement('div');d.className='blk';
  d.innerHTML=`block <b>#${h++}</b> • signed`;tk.prepend(d);while(tk.children.length>4)tk.lastChild.remove()};
 add();setInterval(add,2500)}
// click card dự án
document.querySelectorAll('.project-card').forEach(c=>c.addEventListener('click',e=>{if(!e.target.closest('a'))c.classList.toggle('active')}));
