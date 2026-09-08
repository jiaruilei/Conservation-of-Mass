import {DEFAULTS,LIMITS,validInput,calculateFlow,sectionAt,makeQuestion,correctAnswer} from './physics.js';

const $=id=>document.getElementById(id);
const canvas=$('scene'),ctx=canvas.getContext('2d');
const fmt=(n,d=3)=>n!==0&&(Math.abs(n)>=1e5||Math.abs(n)<.0005)?n.toExponential(2):n.toFixed(d);
let explore={...DEFAULTS},mode='explore';
const quiz={number:0,right:0,answered:0,question:null,submitted:false};
const cv={show:true,region:'volume',normals:false};
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let flow=calculateFlow(explore),view={width:0,height:0},lastTime=0;
const activeState=()=>mode==='quiz'&&quiz.question?quiz.question.state:explore;
const concealAnswer=()=>mode==='quiz'&&!quiz.submitted;

function setInput(key,value){
  explore[key]=value;
  $(key).value=value;$(key+'n').value=value;
  $(key+'n').setAttribute('aria-invalid','false');$(key+'error').hidden=true;
}
for(const [key,[min,max]] of Object.entries(LIMITS)){
  for(const suffix of ['', 'n']){
    $(key+suffix).addEventListener('input',event=>{
      if(!validInput(key,event.target.value)){
        $(key+'n').setAttribute('aria-invalid','true');
        $(key+'error').textContent=`Enter a value from ${min} to ${max}.`;
        $(key+'error').hidden=false;return;
      }
      const value=Number(event.target.value);
      explore[key]=value;
      $(key+(suffix===''?'n':'')).value=value;
      $(key+'n').setAttribute('aria-invalid','false');$(key+'error').hidden=true;
      update();
    });
  }
}
$('lockRho').addEventListener('click',()=>{setInput('rho2',explore.rho1);update();});
$('resetAll').addEventListener('click',()=>{
  for(const [key,value] of Object.entries(DEFAULTS))setInput(key,value);
  cv.show=true;cv.region='volume';cv.normals=false;
  $('toggleCV').checked=true;$('showNormals').checked=false;
  $('normalDetails').open=false;updateCV();update();
});

function setMode(next){
  mode=next;
  for(const name of ['explore','quiz']){
    const key=name==='explore'?'Explore':'Quiz';
    $('panel'+key).hidden=name!==mode;
    $('mode'+key).classList.toggle('active',name===mode);
    $('mode'+key).setAttribute('aria-pressed',String(name===mode));
  }
  update();
}
$('modeExplore').addEventListener('click',()=>setMode('explore'));
$('modeQuiz').addEventListener('click',()=>setMode('quiz'));

function update(){
  const state=activeState();flow=calculateFlow(state);
  for(const key of ['A1','A2','V2','Q1','Q2'])$(key).textContent=fmt(flow[key]);
  $('mdot').textContent=fmt(flow.massIn);
  $('massIn').textContent=fmt(flow.massIn);$('massOut').textContent=fmt(flow.massOut);
  $('accumulation').textContent=fmt(flow.accumulation);
  $('densityNote').textContent=state.V1===0?'With no flow, Q₁ = Q₂ = 0.':state.rho1===state.rho2
    ?'For equal densities, V₁A₁ = V₂A₂ and Q₁ = Q₂.'
    :'Mass flow stays equal. With different densities, Q₁ and Q₂ are different.';
  $('steadyNote').textContent=state.V1===0
    ?'The fluid is at rest. Mass flow and accumulation are both zero.'
    :'Steady flow: mass enters and leaves at the same rate. No mass accumulates inside the control volume.';
  $('fluxValues').textContent=`Inlet: −${fmt(flow.massIn)} kg/s. Outlet: +${fmt(flow.massOut)} kg/s. Wall: 0 kg/s.`;
  const hide=concealAnswer();
  $('outputs').hidden=hide;$('balanceGrid').hidden=hide;$('fluxValues').hidden=hide;
  canvas.setAttribute('aria-label',`Steady pipe flow from inlet section 1 to outlet section 2. ${cv.show?'The fixed control volume follows the pipe wall and is closed by the inlet and outlet faces. ':''}V₁ is ${fmt(state.V1)} metres per second. ${hide?'Find V₂ in the quiz.':`V₂ is ${fmt(flow.V2)} metres per second. Mass entering and leaving is ${fmt(flow.massIn)} kilograms per second. Accumulation is zero.`}`);
  draw();
}

const descriptions={
  volume:'The control volume is a fixed region inside the pipe. Fluid passes through it. Its closed boundary, including the end faces and pipe wall, is the control surface.',
  inlet:'Fluid enters through inlet face A₁. The mass entering each second is ρ₁V₁A₁.',
  outlet:'Fluid leaves through outlet face A₂. The mass leaving each second is ρ₂V₂A₂.',
  wall:'The pipe wall is also part of the control surface. Fluid flows along it and does not cross it. The mass flow through the wall is zero.'
};
function updateCV(){
  $('cvPanel').hidden=!cv.show;
  for(const button of document.querySelectorAll('[data-region]')){
    const selected=button.dataset.region===cv.region;
    button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
  }
  let text=descriptions[cv.region];
  if(cv.normals&&cv.region==='inlet')text+=' The outward normal n₁ points against the flow, so V · n is negative.';
  if(cv.normals&&cv.region==='outlet')text+=' The outward normal n₂ points with the flow, so V · n is positive.';
  if(cv.normals&&cv.region==='wall')text+=' Velocity has no component through the wall, so V · n = 0.';
  $('cvExplanation').textContent=text;
  update();
}
$('toggleCV').addEventListener('change',event=>{cv.show=event.target.checked;updateCV();});
$('showNormals').addEventListener('change',event=>{cv.normals=event.target.checked;updateCV();});
for(const button of document.querySelectorAll('[data-region]'))button.addEventListener('click',()=>{
  cv.region=button.dataset.region;updateCV();
});
function updatePause(){
  $('pauseFlow').textContent=paused?'Resume animation':'Pause animation';
  $('pauseFlow').setAttribute('aria-pressed',String(paused));
}
$('pauseFlow').addEventListener('click',()=>{paused=!paused;updatePause();});
updatePause();

function startQuiz(){
  Object.assign(quiz,{number:0,right:0,answered:0,question:null,submitted:false});
  $('start').textContent='Restart quiz';setMode('quiz');nextQuestion();
}
function nextQuestion(){
  if(quiz.number===10){
    $('qText').textContent=`Round complete. You answered ${quiz.right} of 10 correctly.`;
    $('next').disabled=true;$('answer').disabled=true;$('check').disabled=true;
    $('qText').focus();return;
  }
  quiz.number++;quiz.question=makeQuestion();quiz.submitted=false;
  const s=quiz.question.state;
  $('qText').textContent=`Question ${quiz.number} of 10\nD₁ = ${fmt(s.D1)} m\nD₂ = ${fmt(s.D2)} m\nV₁ = ${fmt(s.V1)} m/s\nρ₁ = ρ₂ = 1000 kg/m³\nFind V₂ (m/s).`;
  $('answer').value='';$('answer').disabled=false;$('answer').setAttribute('aria-invalid','false');
  $('check').disabled=false;$('next').disabled=true;$('feedback').hidden=true;
  $('workedSolution').hidden=true;$('workedSolution').open=false;$('work').textContent='';
  $('score').textContent=`${quiz.right}/${quiz.answered}`;
  update();$('qText').focus();
}
$('start').addEventListener('click',startQuiz);
$('next').addEventListener('click',nextQuestion);
$('answerForm').addEventListener('submit',event=>{
  event.preventDefault();if(!quiz.question||quiz.submitted)return;
  const raw=$('answer').value;
  if(raw.trim()===''||!Number.isFinite(Number(raw))){
    $('answer').setAttribute('aria-invalid','true');
    $('feedback').textContent='Enter your answer first.';$('feedback').className='pill warn';$('feedback').hidden=false;return;
  }
  quiz.submitted=true;quiz.answered++;
  const ok=correctAnswer(raw,quiz.question.answer);if(ok)quiz.right++;
  $('feedback').textContent=`${ok?'Correct.':'Not quite.'} V₂ = ${fmt(quiz.question.answer,4)} m/s.`;
  $('feedback').className='pill '+(ok?'good':'bad');$('feedback').hidden=false;
  $('answer').setAttribute('aria-invalid','false');$('answer').disabled=true;
  $('check').disabled=true;$('next').disabled=false;$('score').textContent=`${quiz.right}/${quiz.answered}`;
  const s=quiz.question.state,f=calculateFlow(s);
  $('work').textContent=`For equal densities, V₁A₁ = V₂A₂.\nA = πD²/4\nV₂ = V₁(D₁/D₂)²\n= ${fmt(s.V1)} × (${fmt(s.D1)}/${fmt(s.D2)})²\n= ${fmt(f.V2,4)} m/s.\nMass entering = mass leaving = ${fmt(f.massIn)} kg/s.`;
  $('workedSolution').hidden=false;update();
});

// Canvas coordinates use CSS pixels, so labels remain readable on small screens.
const colors={inlet:'#2563eb',outlet:'#047857',wall:'#b45309',boundary:'#7c3aed',ink:'#142033'};
const tracers=Array.from({length:120},(_,i)=>({t:((i%24)+.5)/24,lane:(Math.floor(i/24)-2)*.34}));
function geometry(){
  const {width:w,height:h}=view,state=activeState();
  const left=w<450?24:48,right=w-left,cy=h*.51;
  const maxRadius=Math.min(h*.19,w*.20,76);
  const radius=t=>sectionAt(state,t).diameter/Math.max(state.D1,state.D2)*maxRadius;
  const x=t=>left+t*(right-left);
  return {w,h,left,right,cy,radius,x,start:.12,end:.88};
}
function pipePath(g,start=0,end=1,pad=0){
  const p=new Path2D(),steps=70;
  for(let i=0;i<=steps;i++){
    const t=start+(end-start)*i/steps,x=g.x(t),y=g.cy-g.radius(t)-pad;
    if(i===0)p.moveTo(x,y);else p.lineTo(x,y);
  }
  for(let i=steps;i>=0;i--){const t=start+(end-start)*i/steps;p.lineTo(g.x(t),g.cy+g.radius(t)+pad);}
  p.closePath();return p;
}
function arrow(x1,y1,x2,y2,color,width=2.5){
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=width;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const angle=Math.atan2(y2-y1,x2-x1),head=7;
  ctx.beginPath();ctx.moveTo(x2,y2);
  ctx.lineTo(x2-head*Math.cos(angle-.5),y2-head*Math.sin(angle-.5));
  ctx.lineTo(x2-head*Math.cos(angle+.5),y2-head*Math.sin(angle+.5));ctx.closePath();ctx.fill();ctx.restore();
}
function label(text,x,y,color=colors.ink,size=16,align='center'){
  ctx.save();ctx.font=`600 ${size}px system-ui, sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';
  const measured=ctx.measureText(text).width;
  const left=align==='left'?x:align==='right'?x-measured:x-measured/2;
  ctx.fillStyle='rgba(255,255,255,.93)';ctx.fillRect(left-4,y-size*.65,measured+8,size*1.3);
  ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
}
function face(g,t,color,selected){
  const x=g.x(t),r=g.radius(t),rx=view.width<450?6:9;
  ctx.save();ctx.beginPath();ctx.ellipse(x,g.cy,rx,r,0,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=selected?`${color}35`:`${color}18`;ctx.fillRect(x-rx,g.cy-r,2*rx,2*r);
  ctx.strokeStyle=color;ctx.globalAlpha=selected ? .65 : .35;ctx.lineWidth=1;
  for(let y=g.cy-r-2*rx;y<g.cy+r+2*rx;y+=8){ctx.beginPath();ctx.moveTo(x-rx,y);ctx.lineTo(x+rx,y+2*rx);ctx.stroke();}
  ctx.restore();ctx.save();ctx.strokeStyle=color;ctx.lineWidth=selected?3.5:2;
  ctx.beginPath();ctx.ellipse(x,g.cy,rx,r,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function draw(){
  if(!view.width)return;
  const state=activeState(),g=geometry(),dpr=window.devicePixelRatio||1;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,g.w,g.h);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,g.w,g.h);
  const fluid=pipePath(g);
  ctx.fillStyle='#173b74';ctx.fill(pipePath(g,0,1,8));
  const gradient=ctx.createLinearGradient(0,g.cy-76,0,g.cy+76);
  gradient.addColorStop(0,'#bfdbfe');gradient.addColorStop(.48,'#ecfeff');gradient.addColorStop(1,'#93c5fd');
  ctx.fillStyle=gradient;ctx.fill(fluid);
  if(cv.show){ctx.fillStyle=cv.region==='volume'?'#7c3aed16':'#7c3aed08';ctx.fill(pipePath(g,g.start,g.end));}
  ctx.save();ctx.clip(fluid);ctx.fillStyle='#0369a1';
  for(const p of tracers){ctx.beginPath();ctx.arc(g.x(p.t),g.cy+p.lane*g.radius(p.t),g.w<450?1.7:2.1,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  // Transparent transverse faces close the CV; its side boundary lies at the wall.
  if(cv.show){
    ctx.save();ctx.setLineDash([7,5]);ctx.lineWidth=2;ctx.strokeStyle=colors.boundary;
    ctx.stroke(pipePath(g,g.start,g.end));ctx.restore();
    if(cv.region==='wall'){
      ctx.save();ctx.strokeStyle=colors.wall;ctx.lineWidth=4;
      for(const sign of [-1,1]){ctx.beginPath();for(let i=0;i<=70;i++){const t=g.start+(g.end-g.start)*i/70;const x=g.x(t),y=g.cy+sign*g.radius(t);if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
      ctx.restore();
    }
    face(g,g.start,colors.inlet,cv.region==='inlet');face(g,g.end,colors.outlet,cv.region==='outlet');
    label(cv.region==='wall'?'No flow through the wall':'Fixed control volume',g.w/2,30,cv.region==='wall'?colors.wall:colors.boundary,g.w<450?15:17);
  }else label('Steady pipe flow',g.w/2,30,colors.ink,17);
  const a=g.x(g.start),b=g.x(g.end),font=g.w<450?14:16;
  label('Inlet A₁',a,g.cy-g.radius(g.start)-24,colors.inlet,font);
  label('Outlet A₂',b,g.cy-g.radius(g.end)-24,colors.outlet,font);
  const length=Math.min(38,(b-a)*.18);
  if(state.V1>0){
    arrow(a-length,g.cy,a+length,g.cy,colors.inlet,3);
    arrow(b-length,g.cy,b+length,g.cy,colors.outlet,3);
  }
  const y=g.cy+Math.max(g.radius(0),g.radius(1))+29;
  label(`V₁ = ${fmt(state.V1,mode==='quiz'?3:2)}`,a,y,colors.inlet,font);
  label(concealAnswer()?'V₂ = ?':`V₂ = ${fmt(flow.V2,2)}`,b,y,colors.outlet,font);
  label('m/s',g.w/2,y,'#5d6b7d',12);
  if(cv.show&&cv.normals){
    const ny=Math.min(g.h-27,y+42);
    ctx.save();ctx.strokeStyle='#c4b5fd';ctx.setLineDash([3,3]);
    for(const [x,t] of [[a,g.start],[b,g.end]]){ctx.beginPath();ctx.moveTo(x,g.cy+g.radius(t));ctx.lineTo(x,ny);ctx.stroke();}ctx.restore();
    arrow(a,ny,a-length,ny,colors.boundary);arrow(b,ny,b+length,ny,colors.boundary);
    label('n₁',a-length/2,ny-14,colors.boundary,13);label('n₂',b+length/2,ny-14,colors.boundary,13);
    if(cv.region==='wall'){
      const t=.5,x=g.x(t),wy=g.cy-g.radius(t);
      const derivative=(g.radius(t+.001)-g.radius(t-.001))/(.002*(g.right-g.left));
      const norm=Math.hypot(derivative,1),dx=-derivative/norm*30,dy=-1/norm*30;
      arrow(x,wy,x+dx,wy+dy,colors.wall);label('n',x+dx+12,wy+dy,colors.wall,13);
    }
  }
}
function resize(){
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  view={width:rect.width,height:rect.height};canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);draw();
}
new ResizeObserver(resize).observe(canvas);
function animate(time){
  const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
  if(!paused&&!document.hidden){
    const state=activeState();let peak=0;
    for(let i=0;i<=20;i++)peak=Math.max(peak,sectionAt(state,i/20).velocity);
    const scale=Math.min(1,8/(peak||1))*.028;
    for(const p of tracers)p.t=(p.t+sectionAt(state,p.t).velocity*scale*dt)%1;
  }
  draw();requestAnimationFrame(animate);
}
updateCV();requestAnimationFrame(animate);
