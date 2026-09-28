/* Identical V4 deterministic simulation, exported for the authoritative Worker. */
const Adventure = (()=>{
'use strict';
const STEP=1/120,G=1850;
const roles=[
 {id:'cat',name:'熊喵喵',color:'#a6e67b',speed:345,jump:710,h:82,w:43,hp:2,skill:'空中再跳',cooldown:0},
 {id:'pug',name:'肥狗',color:'#ffd3a1',speed:318,jump:710,h:73,w:58,hp:3,skill:'坚果护盾',cooldown:4.5},
 {id:'lezi',name:'乐子狗',color:'#ffd85b',speed:370,jump:710,h:67,w:56,hp:2,skill:'乐子冲刺',cooldown:1.3}
];
const themes=[
 {name:'晨露森林',tag:'学会跳跃，一起出发',sky:['#234f60','#8ec7bd'],far:'#508985',mid:'#397069',stone:'#795d4c',edge:'#9fc575',accent:'#c3e894',time:95},
 {name:'红砖回廊',tag:'熟悉的红砖，新鲜的机关',sky:['#131d36','#535b76'],far:'#323d56',mid:'#263348',stone:'#955b50',edge:'#d1a67b',accent:'#ffd186',time:140},
 {name:'水晶矿洞',tag:'搭上升降台，听见水晶回声',sky:['#0d2037','#355d78'],far:'#183a54',mid:'#102d46',stone:'#3c586e',edge:'#8bd3da',accent:'#9fefff',time:110},
 {name:'风车云岛',tag:'弹簧、浮桥与一小段飞行',sky:['#376b90','#d2e9d9'],far:'#82b6b6',mid:'#639d99',stone:'#8d7962',edge:'#c4d793',accent:'#fff0ad',time:115},
 {name:'熔火工坊',tag:'让冲刺打破沉默的木箱',sky:['#271d2e','#a15144'],far:'#542d36',mid:'#3f2631',stone:'#69494b',edge:'#f2a477',accent:'#ffcd8d',time:120},
 {name:'暴雨钟楼',tag:'小心碎裂的台阶与来回飞轮',sky:['#152d43','#53748b'],far:'#2e5067',mid:'#254356',stone:'#53596d',edge:'#abbed0',accent:'#d1e7ff',time:120},
 {name:'星门守卫',tag:'躲过震波，等待核心打开',sky:['#161b39','#485779'],far:'#313553',mid:'#262947',stone:'#575569',edge:'#bda2cf',accent:'#f2d88e',time:150}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
const rect=p=>({x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h});
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function level(n){
 n=clamp(n|0,0,6);
 const layouts=[
  [[670,600],[350,535],[350,595],[360,515],[350,580],[380,500],[450,580],[360,510],[670,590]],
  [[550,600],[300,540],[300,480],[410,415],[290,540],[290,480],[290,415],[380,500],[290,565],[410,495],[340,420],[290,520],[350,460],[420,395],[300,535],[340,475],[340,410],[800,510]],
  [[650,590],[380,530],[350,450],[360,540],[380,470],[380,395],[400,480],[390,550],[410,465],[400,540],[720,570]],
  [[650,590],[330,510],[350,430],[370,520],[380,445],[380,520],[400,440],[420,520],[420,445],[430,530],[720,570]],
  [[650,590],[380,515],[350,440],[350,520],[400,445],[430,525],[400,445],[410,525],[410,445],[440,520],[740,570]],
  [[650,590],[350,515],[350,435],[350,515],[390,435],[410,515],[410,435],[420,515],[410,435],[440,515],[760,570]],
  [[650,590],[370,510],[370,430],[390,510],[430,440],[440,520],[450,445],[450,520],[1400,570]]
 ][n];
 const w={n,theme:themes[n],platforms:[],spikes:[],saws:[],springs:[],crates:[],coins:[],apples:[],secrets:[],checkpoints:[],enemies:[],signs:[],switches:[],gates:[],particles:[],time:0,deaths:0,events:[],completed:false,cp:0,coinCount:0,appleCount:0,secretCount:0,boss:null,activeTrail:[]};
 let x=0;
 layouts.forEach(([width,y],i)=>{
  const p={id:i,x,y,w:width,h:760-y,kind:'ground',dx:0,dy:0};w.platforms.push(p);
  if(i&&i<layouts.length-1){
   if((i+n)%3===0)w.spikes.push({x:x+width*.65,y:y-23,w:45,h:23});
   if(n>0&&i%4===2)w.enemies.push({x:x+width*.68,y,base:x+width*.68,left:x+50,right:x+width-50,v:45+7*n,dir:1,alive:true,phase:i});
  }
  for(let k=0;k<(i===0?5:4);k++)w.coins.push({x:x+65+k*48,y:y-48,taken:false});
  x+=width+(n===0?80:90+(i%3)*15);
 });
 const ground=w.platforms.slice();
 w.width=x-(n===0?80:90+((layouts.length-1)%3)*15);
 w.start={x:160,y:ground[0].y};w.checkpoints.push({...w.start,index:0,lit:true});
 for(const t of [.34,.68]){const p=ground[Math.floor((ground.length-1)*t)];w.checkpoints.push({x:p.x+58,y:p.y,index:w.checkpoints.length,lit:false});}
 for(const t of [.23,.51,.79]){const p=ground[Math.max(1,Math.floor((ground.length-1)*t))];w.apples.push({x:p.x+p.w*.48,y:p.y-50,taken:false});}
 const last=ground.at(-1);w.goal={x:last.x+last.w-130,y:last.y};
 const pickIndices=[Math.floor(ground.length*.25),Math.floor(ground.length*.52),Math.floor(ground.length*.77)];
 pickIndices.forEach((i,k)=>{
  const p=ground[Math.min(i,ground.length-2)],px=p.x+p.w*.54;
  const shelf={id:100+k,x:px-45,y:p.y-168,w:165,h:17,kind:k===1&&n>=3?'crumble':'wood',oneWay:true,dx:0,dy:0,collapse:0,restore:0};
  w.platforms.push(shelf);w.secrets.push({x:px+40,y:shelf.y-37,taken:false});
  if(k===1&&n>=2)w.crates.push({x:px+5,y:shelf.y-62,w:61,h:62,broken:false,kind:'crate'});
  if(k===2&&n>=2)w.springs.push({x:p.x+p.w*.3,y:p.y,w:44});
 });
 if(n===0){
  w.signs.push({x:300,y:600,text:'按住方向前进',sub:'短按低跳 · 长按高跳'},
   {x:ground[1].x+60,y:ground[1].y,text:'熊喵喵 · 空中再跳',sub:'再按一次跳跃 / 技能'},
   {x:ground[4].x+40,y:ground[4].y,text:'三位伙伴，三种本领',sub:'切换 ⇄ 试试护盾和冲刺'});
 }else w.signs.push({x:320,y:w.start.y,text:themes[n].name,sub:themes[n].tag});
 if(n===1){
  [2,5,9,12,15].forEach((i,k)=>{const p=ground[i];w.platforms.push({id:200+k,x:p.x+20,y:p.y-310,w:240,h:80,kind:'ceiling'});w.spikes.push({x:p.x+90,y:p.y-230,w:66,h:23,down:true});});
  [3,8,13].forEach((i,k)=>{const p=ground[i];w.platforms.push({id:220+k,x:p.x+p.w-18,y:p.y,w:140,h:17,kind:'wood',oneWay:true,dx:0,dy:0});});
 }
 if(n>=2){
  [3,7].forEach((i,k)=>{const p=ground[Math.min(i,ground.length-2)];w.platforms.push({id:300+k,x:p.x+110,y:p.y-80,baseX:p.x+110,baseY:p.y-80,w:126,h:18,kind:'moving',oneWay:true,ampX:k?65:0,ampY:k?0:74,phase:k*2,dx:0,dy:0});});
  [4,8].forEach((i,k)=>{const p=ground[Math.min(i,ground.length-2)];w.saws.push({x:p.x+p.w*.75,y:p.y-110,baseY:p.y-110,r:20,range:60,phase:k*2.2});});
 }
 if(n===3||n===5){[3,6].forEach((i,k)=>{const p=ground[i];w.platforms.push({id:400+k,x:p.x+p.w-12,y:p.y-5,w:130,h:16,kind:'crumble',oneWay:true,dx:0,dy:0,collapse:0,restore:0});});}
 if(n>=4){
  const p=ground[3];w.crates.push({x:p.x+p.w*.7,y:p.y-62,w:61,h:62,broken:false,kind:'crate'});
  const p2=ground[6];w.switches.push({x:p2.x+60,y:p2.y,w:48,active:false,timer:0});
  w.platforms.push({id:500,x:p2.x+100,y:p2.y-100,w:150,h:18,kind:'switch',oneWay:true,dx:0,dy:0,enabled:false});
  w.coins.push({x:p2.x+172,y:p2.y-140,taken:false,value:5});
 }
 if(n===6){
  w.boss={x:last.x+780,y:last.y,hp:6,maxHp:6,timer:0,inv:0,phase:'sleep',waves:[],wake:false,dead:false};
  w.checkpoints.push({x:last.x+90,y:last.y,index:3,lit:false});
  w.signs.push({x:last.x+250,y:last.y,text:'等它打开核心！',sub:'跳踩核心 / 冲刺 / 护盾撞击'});
 }
 return w;
}
function player(type=0,x=160,y=600){const r=roles[type];return{type,x,y,prevY:y,w:r.w,h:r.h,vx:0,vy:0,face:1,ground:true,platform:0,coyote:.11,buffer:0,jumps:0,jumpAge:0,land:0,run:0,idle:0,hp:r.hp,health:roles.map(r=>r.hp),cooldowns:[0,0,0],dash:0,dashUsed:false,shield:0,inv:0,hurt:0,dead:0,trail:[],lastCheckpoint:0};}
function emit(w,name,p,extra={}){w.events.push({name,x:p.x,y:p.y,type:p.type,...extra});}
function switchRole(p,type,w){if(p.dead||type===p.type)return false;const r=roles[type],old=rect(p),newRect={x:p.x-r.w/2,y:p.y-r.h,w:r.w,h:r.h};if(w.platforms.some(s=>!s.oneWay&&overlaps(newRect,s)&&!overlaps(old,s)))return false;p.health[p.type]=p.hp;p.type=type;p.w=r.w;p.h=r.h;p.hp=p.health[type];p.dash=0;p.shield=0;emit(w,'switch',p);return true;}
function hurt(p,w,fall=false){
 if(p.dead||(!fall&&(p.inv>0||p.dash>0||p.shield>0)))return;
 if(!fall){p.hp--;p.health[p.type]=p.hp;p.inv=1.4;p.hurt=.32;p.vy=-250;p.vx=-p.face*160;emit(w,'hurt',p);}
 if(fall||p.hp<=0){p.dead=.78;p.vx=0;p.vy=-220;w.deaths++;emit(w,'death',p);}
}
function respawn(p,w){const cp=w.checkpoints[w.cp];p.x=cp.x;p.y=cp.y;p.vx=0;p.vy=0;p.ground=true;p.platform=null;p.coyote=.11;p.jumps=0;p.dashUsed=false;p.buffer=0;p.health=roles.map(r=>r.hp);p.hp=roles[p.type].hp;p.inv=1.5;p.dead=0;p.shield=0;p.dash=0;p.land=.18;emit(w,'respawn',p);}
function usablePlatforms(w){return w.platforms.filter(s=>!(s.kind==='crumble'&&s.restore>0)&&!(s.kind==='switch'&&!s.enabled));}
function jump(p,w,second=false){p.vy=-(second?670:roles[p.type].jump);p.ground=false;p.platform=null;p.coyote=0;p.jumps=second?2:1;p.buffer=0;p.jumpAge=0;p.land=0;emit(w,second?'double':'jump',p);}
function motion(p,input,w,dt){
 p.prevY=p.y;p.jumpAge+=dt;p.land=Math.max(0,p.land-dt);p.idle+=dt;p.hurt=Math.max(0,p.hurt-dt);p.inv=Math.max(0,p.inv-dt);p.shield=Math.max(0,p.shield-dt);p.dash=Math.max(0,p.dash-dt);p.cooldowns=p.cooldowns.map(x=>Math.max(0,x-dt));
 if(p.dead>0){p.dead-=dt;p.vy+=G*.5*dt;p.y+=p.vy*dt;if(p.dead<=0)respawn(p,w);return;}
 const plats=usablePlatforms(w),support=plats.find(s=>s.id===p.platform);
 if(p.ground&&support){p.x+=support.dx||0;p.y+=support.dy||0;p.prevY=p.y;}
 if(p.ground)p.coyote=.11;else p.coyote=Math.max(0,p.coyote-dt);
 p.buffer=Math.max(0,p.buffer-dt);
 if(input.jumpPress)p.buffer=.13;
 if(input.skillPress){
  if(p.type===0){if(!p.ground&&p.jumps<2)jump(p,w,true);else if(p.ground)p.buffer=.13;}
  if(p.type===1&&p.cooldowns[1]<=0){p.shield=1.7;p.cooldowns[1]=4.5;emit(w,'shield',p);}
  if(p.type===2&&p.cooldowns[2]<=0&&(!p.dashUsed||p.ground)){p.dash=.2;p.cooldowns[2]=1.3;p.dashUsed=true;p.vy=0;emit(w,'dash',p);}
 }
 if(p.buffer>0){if(p.ground||p.coyote>0)jump(p,w);else if(p.type===0&&p.jumps<2&&input.jumpPress)jump(p,w,true);}
 let dir=clamp(input.axis||0,-1,1);if(Math.abs(dir)<.06)dir=0;if(dir)p.face=Math.sign(dir);
 if(p.dash>0){p.vx=p.face*865;p.vy=0;}else{p.vx=approach(p.vx,dir*roles[p.type].speed,(p.ground?dir?2450:3100:1500)*dt);const cut=!input.jumpHeld&&p.vy<-230;p.vy=Math.min(1080,p.vy+G*(cut?2.35:p.vy>0?1.2:1)*dt);}
 const boxes=w.crates.filter(c=>!c.broken);
 let nx=clamp(p.x+p.vx*dt,p.w/2,w.width-p.w/2);
 if(Number.isFinite(input.minX))nx=Math.max(nx,input.minX);
 if(Number.isFinite(input.maxX))nx=Math.min(nx,input.maxX);
 for(const s of [...plats.filter(s=>!s.oneWay),...boxes]){
  const r={x:nx-p.w/2,y:p.y-p.h+1,w:p.w,h:p.h-2};
  if(!overlaps(r,s))continue;
  if(s.kind==='crate'&&p.dash>0){s.broken=true;w.coinCount+=3;emit(w,'break',p);continue;}
  if(p.vx>0)nx=s.x-p.w/2;else if(p.vx<0)nx=s.x+s.w+p.w/2;p.vx=0;
 }
 p.x=nx;let ny=p.y+p.vy*dt;const wasGround=p.ground;p.ground=false;p.platform=null;
 for(const s of [...plats,...boxes.filter(c=>!c.broken)]){
  if(p.x+p.w/2<=s.x+1||p.x-p.w/2>=s.x+s.w-1)continue;
  const topPrev=s.y-(s.dy||0);
  if(p.vy>=0&&p.y<=topPrev+2&&ny>=s.y){ny=s.y;p.vy=0;p.ground=true;p.platform=s.id;p.jumps=0;p.dashUsed=false;}
  else if(!s.oneWay&&p.vy<0&&p.y-p.h>=s.y+s.h-1&&ny-p.h<s.y+s.h){ny=s.y+s.h+p.h;p.vy=0;}
 }
 p.y=ny;
 if(p.ground&&!wasGround){p.land=.12;emit(w,'land',p);if(p.buffer>0)jump(p,w);}
 if(p.ground){const s=plats.find(s=>s.id===p.platform);if(s?.kind==='crumble'&&!s.collapse)s.collapse=.62;}
 p.run+=Math.abs(p.vx)*dt/15;
 for(const s of w.springs){if(p.ground&&Math.abs(p.x-(s.x+s.w/2))<s.w/2+p.w*.35&&Math.abs(p.y-s.y)<8){p.vy=-960;p.ground=false;p.coyote=0;p.jumps=1;p.jumpAge=0;emit(w,'spring',p);}}
 if(p.y>850){hurt(p,w,true);return;}
 const r=rect(p);
 for(const s of w.spikes){if(overlaps(r,{x:s.x+5,y:s.y+5,w:s.w-10,h:s.h-5}))hurt(p,w);}
 for(const s of w.saws){const cx=clamp(s.x,r.x,r.x+r.w),cy=clamp(s.y,r.y,r.y+r.h);if(Math.hypot(s.x-cx,s.y-cy)<s.r)hurt(p,w);}
 for(const e of w.enemies){if(!e.alive)continue;const b={x:e.x-22,y:e.y-32,w:44,h:32};if(overlaps(r,b)){
  if((p.vy>0&&p.prevY<e.y-18)||p.dash>0||p.shield>0){e.alive=false;p.vy=-460;p.ground=false;w.coinCount+=2;emit(w,'stomp',p);}else hurt(p,w);
 }}
 for(const q of w.checkpoints){if(q.index>w.cp&&Math.abs(p.x-q.x)<44&&Math.abs(p.y-q.y)<12&&p.ground){w.cp=q.index;q.lit=true;p.health=roles.map(r=>r.hp);p.hp=roles[p.type].hp;emit(w,'checkpoint',p);}}
 for(const [name,items]of [['coin',w.coins],['apple',w.apples],['secret',w.secrets]])for(const c of items){if(!c.taken&&overlaps(r,{x:c.x-17,y:c.y-19,w:34,h:38})){c.taken=true;w[name+'Count']+=(c.value||1);emit(w,name,c);}}
 for(const s of w.switches){if(p.type===1&&p.ground&&Math.abs(p.x-s.x-s.w/2)<s.w/2+10&&Math.abs(p.y-s.y)<8){if(!s.active)emit(w,'switchPlate',p);s.timer=6;s.active=true;}}
}
function worldTick(w,dt){
 w.time+=dt;
 for(const p of w.platforms){p.dx=p.dy=0;if(p.kind==='moving'){const nx=p.baseX+Math.sin(w.time*1.3+p.phase)*p.ampX,ny=p.baseY+Math.sin(w.time*1.3+p.phase)*p.ampY;p.dx=nx-p.x;p.dy=ny-p.y;p.x=nx;p.y=ny;}
  if(p.kind==='crumble'){if(p.restore>0){p.restore=Math.max(0,p.restore-dt);if(!p.restore)p.collapse=0;}else if(p.collapse>0){p.collapse-=dt;if(p.collapse<=0){p.collapse=0;p.restore=3.2;}}}
  if(p.kind==='switch')p.enabled=w.switches.some(s=>s.timer>0);
 }
 for(const s of w.saws)s.y=s.baseY+Math.sin(w.time*1.6+s.phase)*s.range;
 for(const e of w.enemies){e.x+=e.v*e.dir*dt;if(e.x<e.left){e.x=e.left;e.dir=1;}if(e.x>e.right){e.x=e.right;e.dir=-1;}}
 for(const s of w.switches){s.timer=Math.max(0,s.timer-dt);s.active=s.timer>0;}
}
function bossTick(w,ps,dt){const b=w.boss;if(!b||b.dead)return;
 if(!b.wake){if(ps.some(p=>p.x>b.x-600)){b.wake=true;b.phase='tell';emit(w,'bossWake',b);}else return;}
 b.timer+=dt;b.inv=Math.max(0,b.inv-dt);const duration=b.hp>3?4:3.4,t=b.timer%duration;
 const next=t<1?'tell':t<1.5?'slam':'open';
 if(next==='slam'&&b.phase!=='slam'){b.waves.push({x:b.x,y:b.y,dir:-1,life:3.7},{x:b.x,y:b.y,dir:1,life:3.7});emit(w,'slam',b);}
 b.phase=next;
 for(const v of b.waves){v.x+=v.dir*(b.hp>3?240:300)*dt;v.life-=dt;for(const p of ps)if(!p.dead&&Math.abs(p.x-v.x)<p.w/2+10&&p.y>v.y-25&&p.y-p.h<v.y)hurt(p,w);}
 b.waves=b.waves.filter(v=>v.life>0);
 for(const p of ps){if(p.dead)continue;const r=rect(p),br={x:b.x-55,y:b.y-108,w:110,h:108};if(!overlaps(r,br))continue;
  const stomp=p.vy>0&&p.prevY<=b.y-90;
  if(b.phase==='open'&&b.inv<=0&&(stomp||p.dash>0||p.shield>0)){b.hp--;b.inv=.75;p.vy=-620;p.ground=false;p.inv=.9;emit(w,'bossHit',p);if(b.hp<=0){b.dead=true;b.waves=[];emit(w,'bossDown',b);}}
  else if(b.inv<=0){hurt(p,w);p.x=b.x+(p.x<b.x?-1:1)*95;}
 }
}
function tick(w,ps,inputs,dt=STEP){
 w.events=[];if(w.completed)return w.events;
 worldTick(w,dt);
 const maxDist=w.cameraWidth?Math.max(180,w.cameraWidth*.73):900;
 const moves=ps.map((p,i)=>ps.length===2?{...(inputs[i]||{}),minX:Math.min(p.x,ps[1-i].x-maxDist),maxX:Math.max(p.x,ps[1-i].x+maxDist)}:inputs[i]||{});
 ps.forEach((p,i)=>motion(p,moves[i],w,dt));bossTick(w,ps,dt);
 if(ps.length===2&&w.events.some(e=>e.name==='respawn')&&Math.abs(ps[0].x-ps[1].x)>maxDist){ps.forEach((p,i)=>{respawn(p,w);p.x+=i*62;});}
 if(w.appleCount>=3&&(!w.boss||w.boss.dead)&&ps.every(p=>!p.dead&&Math.abs(p.x-w.goal.x)<105&&Math.abs(p.y-w.goal.y)<130)){w.completed=true;emit(w,'complete',w.goal);}
 return w.events;
}
function snapshot(w){return{level:w.n,cp:w.cp,time:w.time,deaths:w.deaths,coins:w.coins.map(c=>c.taken),apples:w.apples.map(c=>c.taken),secrets:w.secrets.map(c=>c.taken),crates:w.crates.map(c=>c.broken),coinCount:w.coinCount,bossDead:!!w.boss?.dead};}
function restore(w,s){if(!s||s.level!==w.n)return;w.cp=clamp(s.cp|0,0,w.checkpoints.length-1);w.time=Math.max(0,Number(s.time)||0);w.deaths=Math.max(0,s.deaths|0);for(const k of ['coins','apples','secrets'])w[k].forEach((c,i)=>c.taken=!!s[k]?.[i]);w.crates.forEach((c,i)=>c.broken=!!s.crates?.[i]);w.appleCount=w.apples.filter(c=>c.taken).length;w.secretCount=w.secrets.filter(c=>c.taken).length;w.coinCount=Math.max(0,s.coinCount|0);w.checkpoints.forEach(q=>q.lit=q.index<=w.cp);if(w.boss&&s.bossDead){w.boss.dead=true;w.boss.hp=0;}}
return{STEP,G,roles,themes,clamp,approach,rect,overlaps,level,player,switchRole,hurt,respawn,motion,tick,snapshot,restore,usablePlatforms};
})();
export default Adventure;
