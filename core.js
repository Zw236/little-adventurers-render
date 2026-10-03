/* V7 deterministic simulation shared by offline play and the room server. */
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
 {name:'星门守卫',tag:'守卫战',sky:['#161b39','#485779'],far:'#313553',mid:'#262947',stone:'#575569',edge:'#bda2cf',accent:'#f2d88e',time:150},
 {name:'萤火湿地',tag:'跳过湿地',sky:['#213c45','#629b85'],far:'#315e62',mid:'#345c56',stone:'#596d63',edge:'#a0d6a1',accent:'#bdeabc',time:130},
 {name:'蘑菇溪谷',tag:'弹跳路线',sky:['#263e59','#a6a3bc'],far:'#4f6680',mid:'#416775',stone:'#656178',edge:'#d9a6c4',accent:'#efbddc',time:135},
 {name:'古树树冠',tag:'风道飞跃',sky:['#1d4b50','#9ec5a3'],far:'#478780',mid:'#396f6d',stone:'#665e4c',edge:'#a9d88a',accent:'#cae89c',time:135},
 {name:'悬空风径',tag:'风道与浮台',sky:['#416c99','#d6d9bc'],far:'#8799ad',mid:'#62879f',stone:'#748393',edge:'#d4deb0',accent:'#e5f0c4',time:150},
 {name:'雷鸣巨鸟',tag:'守卫战',sky:['#182a59','#6577a5'],far:'#394574',mid:'#2d3861',stone:'#526080',edge:'#becce5',accent:'#a7deff',time:170},
 {name:'薄冰栈道',tag:'冰面冲刺',sky:['#244a63','#b4dae2'],far:'#568eaa',mid:'#417789',stone:'#638897',edge:'#cbeced',accent:'#d6ffff',time:130},
 {name:'雪松山坡',tag:'冰面与弹簧',sky:['#42617a','#d6e4e7'],far:'#8299ac',mid:'#668899',stone:'#728899',edge:'#e7f3ec',accent:'#f7fff3',time:140},
 {name:'极光冰河',tag:'穿越风雪',sky:['#223b67','#9ab4c8'],far:'#496d95',mid:'#3c6383',stone:'#5d7995',edge:'#b0e9ec',accent:'#bdf4ff',time:140},
 {name:'镜面迷宫',tag:'踏上移动浮台',sky:['#26385d','#9fb0cf'],far:'#516894',mid:'#394e79',stone:'#61708d',edge:'#d0e3ec',accent:'#d8eaff',time:145},
 {name:'冰晶吊桥',tag:'碎裂的冰桥',sky:['#1c4262','#a1d1df'],far:'#497e99',mid:'#356d89',stone:'#65869b',edge:'#c9f1ed',accent:'#dbffff',time:150},
 {name:'寒霜巨熊',tag:'守卫战',sky:['#142b4e','#7db5c5'],far:'#355e82',mid:'#2a5871',stone:'#536f87',edge:'#b1e9df',accent:'#dbfff4',time:180},
 {name:'晚霞峡谷',tag:'跃过断崖',sky:['#654967','#e5a17e'],far:'#a16c77',mid:'#825c75',stone:'#86616a',edge:'#efbd91',accent:'#ffe0a7',time:140},
 {name:'云海长桥',tag:'借风越过长桥',sky:['#5e80a2','#d5ded1'],far:'#8eb2b4',mid:'#6f9aa6',stone:'#747b8d',edge:'#e6d6a4',accent:'#fff1c6',time:145},
 {name:'流星花园',tag:'星光机关',sky:['#40365c','#a280b2'],far:'#655a88',mid:'#51466f',stone:'#6f6682',edge:'#c9aad7',accent:'#efc5ef',time:150},
 {name:'月影遗迹',tag:'最后的准备',sky:['#1e2a56','#797fa9'],far:'#495782',mid:'#35436c',stone:'#5b607f',edge:'#b8b7d8',accent:'#ddd7ff',time:150},
 {name:'星火回廊',tag:'通往终点',sky:['#2d2755','#a277a4'],far:'#5b4c82',mid:'#42356b',stone:'#605574',edge:'#d9b9d5',accent:'#ffd5e6',time:155},
 {name:'月影魔王',tag:'最终守卫战',sky:['#111b3b','#626b9e'],far:'#303b68',mid:'#252e59',stone:'#565d82',edge:'#d0b9e7',accent:'#f3d3fa',time:195}
];
const LEVEL_COUNT=themes.length;
const BOSSES={6:{kind:'stone',name:'星门守卫',hp:6},11:{kind:'storm',name:'雷鸣巨鸟',hp:7},17:{kind:'frost',name:'寒霜巨熊',hp:8},23:{kind:'moon',name:'月影魔王',hp:10}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
const rect=p=>({x:p.x-p.w/2,y:p.y-p.h,w:p.w,h:p.h});
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function level(n){
 n=clamp(n|0,0,LEVEL_COUNT-1);
 const layouts=[
  [[670,600],[350,535],[350,595],[360,515],[350,580],[380,500],[450,580],[360,510],[670,590]],
  [[550,600],[300,540],[300,480],[410,415],[290,540],[290,480],[290,415],[380,500],[290,565],[410,495],[340,420],[290,520],[350,460],[420,395],[300,535],[340,475],[340,410],[800,510]],
  [[650,590],[380,530],[350,450],[360,540],[380,470],[380,395],[400,480],[390,550],[410,465],[400,540],[720,570]],
  [[650,590],[330,510],[350,430],[370,520],[380,445],[380,520],[400,440],[420,520],[420,445],[430,530],[720,570]],
  [[650,590],[380,515],[350,440],[350,520],[400,445],[430,525],[400,445],[410,525],[410,445],[440,520],[740,570]],
  [[650,590],[350,515],[350,435],[350,515],[390,435],[410,515],[410,435],[420,515],[410,435],[440,515],[760,570]],
  [[650,590],[370,510],[370,430],[390,510],[430,440],[440,520],[450,445],[450,520],[1400,570]]
 ][n]||expandedLayout(n);
 const w={n,theme:themes[n],waterZones:[],chaser:null,teamCount:1,platforms:[],spikes:[],saws:[],springs:[],windZones:[],crates:[],coins:[],apples:[],secrets:[],checkpoints:[],enemies:[],signs:[],switches:[],gates:[],particles:[],time:0,deaths:0,events:[],completed:false,cp:0,coinCount:0,appleCount:0,secretCount:0,boss:null,activeTrail:[]};
 let x=0;
 layouts.forEach(([width,y],i)=>{
  const p={id:i,x,y,w:width,h:760-y,kind:'ground',slippery:n>=12&&n<=17&&i%3!==0,dx:0,dy:0};w.platforms.push(p);
  if(i&&i<layouts.length-1){
   if((i+n)%3===0)w.spikes.push({x:x+width*.65,y:y-23,w:45,h:23});
   if(n>0&&i%4===2)w.enemies.push({x:x+width*.68,y,base:x+width*.68,left:x+50,right:x+width-50,v:Math.min(130,45+5*n),dir:1,alive:true,phase:i,kind:n>=10&&i%4===2?'charger':n>=7&&i%3===2?'flyer':'walker',baseY:y,state:'patrol',timer:0,death:0});
  }
  for(let k=0;k<(i===0?5:4);k++)w.coins.push({x:x+65+k*48,y:y-48,taken:false});
  x+=width+(n===0?80:n<7?90+(i%3)*15:72+(i+n)%4*17);
 });
 const ground=w.platforms.slice();
 w.width=x-(n===0?80:n<7?90+((layouts.length-1)%3)*15:72+(layouts.length-1+n)%4*17);
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
 if(n===0)w.signs.push({x:ground[1].x+60,y:ground[1].y,text:'空中再按跳跃',sub:'熊喵喵可二段跳'});
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
 if(n>=7){
  const chapter=Math.floor((n-7)/6);
  ground.slice(2,-1).forEach((p,i)=>{
   if((i+n)%3===0)w.platforms.push({id:600+i,x:p.x+p.w*.48,y:p.y-126,w:136,h:16,kind:i%2?'moving':'crumble',oneWay:true,dx:0,dy:0,baseX:p.x+p.w*.48,baseY:p.y-126,ampX:0,ampY:40,phase:i,collapse:0,restore:0});
   if((i+n)%4===1)w.crates.push({x:p.x+p.w*.7,y:p.y-62,w:61,h:62,broken:false,kind:'crate'});
   if((i+n)%5===2)w.springs.push({x:p.x+p.w*.24,y:p.y,w:44});
   if(chapter===0&&i%3===1||chapter>=2&&i%4===1)w.windZones.push({x:p.x+p.w-35,y:p.y-265,w:112,h:245,lift:chapter>=2?3000:2600,drift:(i%2?1:-1)*80});
   if(chapter===1&&i%4===0)w.saws.push({x:p.x+p.w*.55,y:p.y-105,baseY:p.y-105,r:20,range:55,phase:i});
  });
  if(n>=19){const p=ground[Math.floor(ground.length*.6)];w.switches.push({x:p.x+65,y:p.y,w:48,active:false,timer:0});w.platforms.push({id:900,x:p.x+p.w-35,y:p.y-112,w:180,h:18,kind:'switch',oneWay:true,dx:0,dy:0,enabled:false});w.coins.push({x:p.x+p.w+38,y:p.y-162,taken:false,value:5});}
 }
 if([4,8,12,15,19,21].includes(n)){
  const p=ground[2],group='pair';
  for(const off of [65,p.w-65])w.switches.push({kind:'pair',group,x:p.x+off,y:p.y,w:48,active:false,timer:0});
  w.platforms.push({id:950,x:p.x+p.w*.45,y:p.y-205,w:165,h:18,kind:'coop',oneWay:true,dx:0,dy:0,enabled:false});
  w.secrets[0].x=p.x+p.w*.45+80;w.secrets[0].y=p.y-240;
  w.crates.push({x:p.x+p.w*.4,y:p.y-62,w:61,h:62,broken:false,kind:'crate',movable:true,minX:p.x+8,maxX:p.x+p.w-70});
 }
 if([2,10,16,22].includes(n)){
  const p=ground[2];w.platforms.push({id:960,x:p.x+110,y:p.y-63,baseX:p.x+110,baseY:p.y-63,w:125,h:20,kind:'cart',oneWay:true,ampX:100,ampY:0,phase:0,dx:0,dy:0});
 }
 if([7,8,14,20].includes(n))for(const i of [2,5]){
  const p=ground[i],next=ground[i+1];w.waterZones.push({x:p.x+p.w-2,y:Math.max(p.y,next.y)+10,w:next.x-p.x-p.w+4,h:95});
 }
 if([5,9,18,22].includes(n))w.chaser={x:-500,y:ground[0].y,active:false,speed:265,trigger:ground[2].x,r:38};
 if(BOSSES[n]){
  const info=BOSSES[n];w.boss={x:last.x+780,y:last.y,hp:info.hp,maxHp:info.hp,kind:info.kind,name:info.name,timer:0,inv:0,phase:'sleep',waves:[],orbs:[],targets:[],stage:1,cycle:-1,combo:false,wake:false,dead:false};
  w.checkpoints.push({x:last.x+90,y:last.y,index:w.checkpoints.length,lit:false});
 }
 return w;
}
function expandedLayout(n){
 const count=10+(n%4)*2+(BOSSES[n]?1:0),out=[];
 const base=[570,530,585,505,555,490,565];
 for(let i=0;i<count;i++){
  if(i===0){out.push([650,590]);continue;}
  if(i===count-1){out.push([BOSSES[n]?1500:760,570]);continue;}
  out.push([390+((n*47+i*131)%4)*62,base[(n+i*3)%base.length]]);
 }
 return out;
}
function player(type=0,x=160,y=600){const r=roles[type];return{type,x,y,prevY:y,w:r.w,h:r.h,vx:0,vy:0,face:1,ground:true,platform:0,coyote:.11,buffer:0,jumps:0,jumpAge:0,land:0,run:0,idle:0,hp:r.hp,health:roles.map(r=>r.hp),cooldowns:[0,0,0],dash:0,dashUsed:false,shield:0,inv:0,hurt:0,dead:0,trail:[],lastCheckpoint:0,downTimer:0,rescue:0,boostCooldown:0,inWater:false,turn:0};}
function emit(w,name,p,extra={}){w.events.push({name,x:p.x,y:p.y,type:p.type,...extra});}
function switchRole(p,type,w){if(p.dead||p.downTimer>0||type===p.type)return false;const r=roles[type],old=rect(p),newRect={x:p.x-r.w/2,y:p.y-r.h,w:r.w,h:r.h};if(w.platforms.some(s=>!s.oneWay&&overlaps(newRect,s)&&!overlaps(old,s)))return false;p.health[p.type]=p.hp;p.type=type;p.w=r.w;p.h=r.h;p.hp=p.health[type];p.dash=0;p.shield=0;emit(w,'switch',p);return true;}
function hurt(p,w,fall=false){
 if(p.dead||p.downTimer>0||(!fall&&(p.inv>0||p.dash>0||p.shield>0)))return;
 if(!fall){p.hp--;p.health[p.type]=p.hp;p.inv=1.4;p.hurt=.32;p.vy=-250;p.vx=-p.face*160;emit(w,'hurt',p);}
 if(fall||p.hp<=0){p.vx=0;w.deaths++;if(!fall&&w.teamCount===2){p.downTimer=9;p.rescue=0;p.vy=0;emit(w,'downed',p);}else{p.dead=.78;p.vy=-220;emit(w,'death',p);}}
}
function respawn(p,w){const cp=w.checkpoints[w.cp];p.x=cp.x;p.y=cp.y;p.vx=0;p.vy=0;p.ground=true;p.platform=null;p.coyote=.11;p.jumps=0;p.dashUsed=false;p.buffer=0;p.health=roles.map(r=>r.hp);p.hp=roles[p.type].hp;p.inv=1.5;p.dead=0;p.downTimer=0;p.rescue=0;p.shield=0;p.dash=0;p.land=.18;emit(w,'respawn',p);}
function usablePlatforms(w){return w.platforms.filter(s=>!(s.kind==='crumble'&&s.restore>0)&&!(['switch','coop'].includes(s.kind)&&!s.enabled));}
function jump(p,w,second=false){p.vy=-(second?670:roles[p.type].jump);p.ground=false;p.platform=null;p.coyote=0;p.jumps=second?2:1;p.buffer=0;p.jumpAge=0;p.land=0;emit(w,second?'double':'jump',p);}
function motion(p,input,w,dt){
 if(p.downTimer>0){p.downTimer=Math.max(0,p.downTimer-dt);p.vx=0;if(!p.downTimer){respawn(p,w);}return;}
 p.turn=Math.max(0,(p.turn||0)-dt);
 p.boostCooldown=Math.max(0,(p.boostCooldown||0)-dt);
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
 let dir=clamp(input.axis||0,-1,1);if(Math.abs(dir)<.06)dir=0;if(dir){if(Math.sign(dir)!==p.face)p.turn=.1;p.face=Math.sign(dir);}
 if(p.dash>0){p.vx=p.face*865;p.vy=0;}else{const slick=!!(p.ground&&support?.slippery);p.vx=approach(p.vx,dir*roles[p.type].speed,(p.ground?slick?dir?780:320:dir?2450:3100:1500)*dt);const cut=!input.jumpHeld&&p.vy<-230;p.vy=Math.min(1080,p.vy+G*(cut?2.35:p.vy>0?1.2:1)*dt);}
 for(const z of w.windZones){if(overlaps(rect(p),z)&&p.dash<=0){p.vy=Math.max(-600,p.vy-z.lift*dt);p.vx+=z.drift*dt;}}
 p.inWater=w.waterZones.some(z=>overlaps(rect(p),z));if(p.inWater&&p.dash<=0){p.vx*=Math.exp(-dt*1.3);p.vy=approach(p.vy,input.jumpHeld?-280:-70,6800*dt);}
 const boxes=w.crates.filter(c=>!c.broken);
 let nx=clamp(p.x+p.vx*dt,p.w/2,w.width-p.w/2);
 if(Number.isFinite(input.minX))nx=Math.max(nx,input.minX);
 if(Number.isFinite(input.maxX))nx=Math.min(nx,input.maxX);
 for(const s of [...plats.filter(s=>!s.oneWay),...boxes]){
  const r={x:nx-p.w/2,y:p.y-p.h+1,w:p.w,h:p.h-2};
  if(!overlaps(r,s))continue;
  if(s.kind==='crate'&&p.dash>0){s.broken=true;w.coinCount+=3;emit(w,'break',p);continue;}
  if(s.kind==='crate'&&s.movable&&Math.abs(input.axis||0)>.05){const shift=(p.type===1?205:110)*Math.sign(input.axis)*dt,tx=clamp(s.x+shift,s.minX,s.maxX);if(![...plats.filter(q=>!q.oneWay),...boxes.filter(q=>q!==s)].some(q=>overlaps({x:tx,y:s.y,w:s.w,h:s.h},q))){s.x=tx;nx=tx+(shift>0?-p.w/2:s.w+p.w/2);p.vx=shift/dt;continue;}}
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
 p.run+=Math.abs(p.vx)*dt/22;
 for(const s of w.springs){if(p.ground&&Math.abs(p.x-(s.x+s.w/2))<s.w/2+p.w*.35&&Math.abs(p.y-s.y)<8){p.vy=-960;p.ground=false;p.coyote=0;p.jumps=1;p.jumpAge=0;emit(w,'spring',p);}}

 if(p.y>850){hurt(p,w,true);return;}
 const r=rect(p);
 for(const s of w.spikes){if(overlaps(r,{x:s.x+5,y:s.y+5,w:s.w-10,h:s.h-5}))hurt(p,w);}
 for(const s of w.saws){const cx=clamp(s.x,r.x,r.x+r.w),cy=clamp(s.y,r.y,r.y+r.h);if(Math.hypot(s.x-cx,s.y-cy)<s.r)hurt(p,w);}
 for(const e of w.enemies){if(!e.alive)continue;const b={x:e.x-(e.kind==='charger'?30:22),y:e.y-(e.kind==='charger'?42:32),w:e.kind==='charger'?60:44,h:e.kind==='charger'?42:32};if(overlaps(r,b)){
  if((p.vy>0&&p.prevY<e.y-18)||p.dash>0||p.shield>0){e.alive=false;e.death=.6;e.state='dead';p.vy=-460;p.ground=false;w.coinCount+=2;emit(w,'stomp',p);}else hurt(p,w);
 }}
 for(const q of w.checkpoints){if(q.index>w.cp&&Math.abs(p.x-q.x)<44&&Math.abs(p.y-q.y)<12&&p.ground){w.cp=q.index;q.lit=true;p.health=roles.map(r=>r.hp);p.hp=roles[p.type].hp;emit(w,'checkpoint',p);}}
 for(const [name,items]of [['coin',w.coins],['apple',w.apples],['secret',w.secrets]])for(const c of items){if(!c.taken&&overlaps(r,{x:c.x-17,y:c.y-19,w:34,h:38})){c.taken=true;w[name+'Count']+=(c.value||1);emit(w,name,c);}}
 for(const s of w.switches){if((s.kind==='pair'||p.type===1)&&p.ground&&Math.abs(p.x-s.x-s.w/2)<s.w/2+10&&Math.abs(p.y-s.y)<8){if(!s.active)emit(w,'switchPlate',p,{pair:s.kind==='pair'});s.timer=s.kind==='pair'?(w.teamCount===1?6:.16):6;s.active=true;}}
}
function worldTick(w,dt,ps=[]){
 w.time+=dt;
 for(const p of w.platforms){p.dx=p.dy=0;if(p.kind==='moving'||p.kind==='cart'){const nx=p.baseX+Math.sin(w.time*(p.kind==='cart'?1.8:1.3)+p.phase)*p.ampX,ny=p.baseY+Math.sin(w.time*(p.kind==='cart'?1.8:1.3)+p.phase)*p.ampY;p.dx=nx-p.x;p.dy=ny-p.y;p.x=nx;p.y=ny;}
  if(p.kind==='crumble'){if(p.restore>0){p.restore=Math.max(0,p.restore-dt);if(!p.restore)p.collapse=0;}else if(p.collapse>0){p.collapse-=dt;if(p.collapse<=0){p.collapse=0;p.restore=3.2;}}}
  if(p.kind==='switch')p.enabled=w.switches.some(s=>s.kind!=='pair'&&s.timer>0);
  if(p.kind==='coop'){const pairs=w.switches.filter(s=>s.kind==='pair');if(pairs.length&&pairs.every(s=>s.timer>0)){p.hold=7;if(!p.enabled)emit(w,'coopBridge',p);}p.hold=Math.max(0,(p.hold||0)-dt);p.enabled=p.hold>0;}
 }
 for(const s of w.saws)s.y=s.baseY+Math.sin(w.time*1.6+s.phase)*s.range;
 for(const e of w.enemies){
  if(!e.alive){e.death=Math.max(0,(e.death||0)-dt);continue;}
  e.timer=Math.max(0,e.timer-dt);let speed=e.v;
  if(e.kind==='flyer')e.y=e.baseY-130+Math.sin(w.time*3+e.phase)*26;
  if(e.kind==='charger'){
   const target=ps.find(p=>!p.dead&&!p.downTimer&&Math.abs(p.x-e.x)<270&&Math.abs(p.y-e.y)<55);
   if(e.state==='patrol'&&target){e.state='tell';e.timer=.6;e.dir=Math.sign(target.x-e.x)||1;}
   if(e.state==='tell'){speed=0;if(!e.timer){e.state='charge';e.timer=.65;}}
   if(e.state==='charge'){speed=410;if(!e.timer){e.state='recover';e.timer=1.3;}}
   if(e.state==='recover'){speed=0;if(!e.timer)e.state='patrol';}
  }
  e.x+=speed*e.dir*dt;if(e.x<e.left){e.x=e.left;e.dir=1;}if(e.x>e.right){e.x=e.right;e.dir=-1;}
 }
 if(w.chaser){const h=w.chaser,lead=ps.find(p=>!p.dead&&!p.downTimer);if(lead&&lead.x>h.trigger)h.active=true;if(h.active){h.x+=h.speed*dt;const floor=w.platforms.find(p=>p.kind==='ground'&&h.x>=p.x&&h.x<=p.x+p.w);if(floor)h.y=floor.y;}}

 for(const s of w.switches){s.timer=Math.max(0,s.timer-dt);s.active=s.timer>0;}
}
function teamTick(w,ps,inputs,dt){
 if(ps.length!==2)return;
 if(ps.every(p=>p.dead||p.downTimer>0)){for(const p of ps)if(p.downTimer>0)p.downTimer=Math.min(p.downTimer,.1);return;}
 for(let i=0;i<2;i++){
  const p=ps[i],helper=ps[1-i],near=!helper.dead&&!helper.downTimer&&Math.abs(helper.x-p.x)<100&&Math.abs(helper.y-p.y)<70;
  if(p.downTimer>0){p.rescue=near&&inputs[1-i]?.skillHeld?p.rescue+dt:Math.max(0,p.rescue-dt*2);if(p.rescue>=1.2){p.downTimer=0;p.rescue=0;p.hp=1;p.health[p.type]=1;p.inv=2;p.hurt=0;emit(w,'rescue',p);}}
  if(!p.dead&&!p.downTimer&&near&&p.ground&&helper.ground&&inputs[i]?.skillPress&&p.boostCooldown<=0&&Math.abs(p.x-helper.x)>12){helper.vy=-925;helper.ground=false;helper.platform=null;helper.jumps=1;helper.jumpAge=0;helper.coyote=0;p.boostCooldown=1.1;emit(w,'boost',helper);}
 }
}
function bossAttack(w,b,ps,extra=false){
 const stage=b.stage||1,speed=extra?1.2:1;
 b.waves.push({x:b.x,y:b.y,dir:-1,life:3.7},{x:b.x,y:b.y,dir:1,life:3.7});
 if(b.kind==='storm'||b.kind==='moon'){
  const count=b.kind==='moon'?stage===2?5:3:stage===2?4:2;
  for(let i=0;i<count;i++)b.orbs.push({x:b.x+(i%2?-62:62),y:b.y-115-i*15,vx:(i%2?-1:1)*(b.kind==='moon'?280:235)*speed,vy:-80-i*32,life:3,r:14});
 }
 if(b.kind==='frost'||b.kind==='stone'&&stage===2){
  for(const x of b.targets||[])b.orbs.push({x,y:b.y-380,vx:0,vy:b.kind==='frost'?175:230,life:2.6,r:b.kind==='frost'?18:22});
 }
 emit(w,'slam',b);
}
function bossTick(w,ps,dt){const b=w.boss;if(!b||b.dead)return;
 if(!b.wake){if(ps.some(p=>p.x>b.x-600)){b.wake=true;b.phase='tell';emit(w,'bossWake',b);}else return;}
 if(b.hp<=b.maxHp/2&&b.stage!==2){b.stage=2;b.timer=0;b.phase='tell';b.cycle=-1;b.combo=false;b.waves=[];b.orbs=[];emit(w,'bossEnrage',b);}
 b.timer+=dt;b.inv=Math.max(0,b.inv-dt);const duration=(b.kind==='moon'?3.25:b.kind==='frost'?3.7:b.kind==='storm'?3.5:4)-(b.stage===2?.35:0),t=b.timer%duration,cycle=Math.floor(b.timer/duration);
 if(b.cycle!==cycle){b.cycle=cycle;b.combo=false;b.targets=ps.filter(p=>!p.dead&&!p.downTimer).map(p=>clamp(p.x+p.vx*.25,b.x-570,b.x+550));if(b.stage===2)b.targets.push(b.x-175,b.x+175);}
 const next=t<.86?'tell':t<(b.stage===2?1.45:1.32)?'slam':'open';
 if(next==='slam'&&b.phase!=='slam')bossAttack(w,b,ps);
 if(b.stage===2&&t>=1.18&&t<1.45&&!b.combo){b.combo=true;bossAttack(w,b,ps,true);}
 b.phase=next;
 for(const v of b.waves){v.x+=v.dir*(b.stage===2?310:240)*dt;v.life-=dt;for(const p of ps)if(!p.dead&&!p.downTimer&&Math.abs(p.x-v.x)<p.w/2+10&&p.y>v.y-25&&p.y-p.h<v.y)hurt(p,w);}
 b.waves=b.waves.filter(v=>v.life>0);
 for(const orb of b.orbs){orb.x+=orb.vx*dt;orb.y+=orb.vy*dt;orb.vy+=(b.kind==='frost'||b.kind==='stone'?300:135)*dt;orb.life-=dt;
  for(const p of ps)if(!p.dead&&!p.downTimer&&overlaps(rect(p),{x:orb.x-orb.r,y:orb.y-orb.r,w:orb.r*2,h:orb.r*2})){hurt(p,w);orb.life=0;}
 }
 b.orbs=b.orbs.filter(o=>o.life>0&&o.y<b.y+35);
 for(const p of ps){if(p.dead||p.downTimer>0)continue;const r=rect(p),br={x:b.x-55,y:b.y-108,w:110,h:108};if(!overlaps(r,br))continue;
  const stomp=p.vy>0&&p.prevY<=b.y-90;
  if(b.phase==='open'&&b.inv<=0&&(stomp||p.dash>0||p.shield>0)){b.hp--;b.inv=.75;p.vy=-620;p.ground=false;p.inv=.9;emit(w,'bossHit',p);if(b.hp<=0){b.dead=true;b.waves=[];b.orbs=[];emit(w,'bossDown',b);}}
  else if(b.inv<=0){hurt(p,w);p.x=b.x+(p.x<b.x?-1:1)*95;}
 }
}
function tick(w,ps,inputs,dt=STEP){
 w.events=[];if(w.completed)return w.events;
 w.teamCount=ps.length;worldTick(w,dt,ps);
 const maxDist=w.cameraWidth?Math.max(180,w.cameraWidth*.73):900;
 const moves=ps.map((p,i)=>ps.length===2?{...(inputs[i]||{}),minX:Math.min(p.x,ps[1-i].x-maxDist),maxX:Math.max(p.x,ps[1-i].x+maxDist)}:inputs[i]||{});
 ps.forEach((p,i)=>motion(p,moves[i],w,dt));teamTick(w,ps,inputs,dt);
 if(w.chaser&&w.events.some(e=>e.name==='respawn'))w.chaser.x=w.checkpoints[w.cp].x-620;
 bossTick(w,ps,dt);
 if(w.chaser?.active)for(const p of ps)if(!p.dead&&!p.downTimer&&Math.abs(p.x-w.chaser.x)<p.w/2+w.chaser.r*.8&&Math.abs(p.y-w.chaser.y)<p.h+25)hurt(p,w,true);
 if(ps.length===2&&w.events.some(e=>e.name==='respawn')&&Math.abs(ps[0].x-ps[1].x)>maxDist){ps.forEach((p,i)=>{respawn(p,w);p.x+=i*62;});}
 if(w.appleCount>=3&&(!w.boss||w.boss.dead)&&ps.every(p=>!p.dead&&!p.downTimer&&Math.abs(p.x-w.goal.x)<105&&Math.abs(p.y-w.goal.y)<130)){w.completed=true;emit(w,'complete',w.goal);}
 return w.events;
}
function snapshot(w){return{level:w.n,cp:w.cp,time:w.time,deaths:w.deaths,coins:w.coins.map(c=>c.taken),apples:w.apples.map(c=>c.taken),secrets:w.secrets.map(c=>c.taken),crates:w.crates.map(c=>c.broken),boxPositions:w.crates.map(c=>[c.x,c.y]),coinCount:w.coinCount,bossDead:!!w.boss?.dead};}
function restore(w,s){if(!s||s.level!==w.n)return;w.cp=clamp(s.cp|0,0,w.checkpoints.length-1);w.time=Math.max(0,Number(s.time)||0);w.deaths=Math.max(0,s.deaths|0);for(const k of ['coins','apples','secrets'])w[k].forEach((c,i)=>c.taken=!!s[k]?.[i]);w.crates.forEach((c,i)=>{c.broken=!!s.crates?.[i];if(c.movable&&s.boxPositions?.[i]){c.x=clamp(s.boxPositions[i][0],c.minX,c.maxX);}});w.appleCount=w.apples.filter(c=>c.taken).length;w.secretCount=w.secrets.filter(c=>c.taken).length;w.coinCount=Math.max(0,s.coinCount|0);w.checkpoints.forEach(q=>q.lit=q.index<=w.cp);if(w.boss&&s.bossDead){w.boss.dead=true;w.boss.hp=0;}}

const PLAYER_FIELDS=['type','x','y','prevY','vx','vy','face','ground','platform','coyote','buffer','jumps','jumpAge','land','run','idle','hp','health','cooldowns','dash','dashUsed','shield','inv','hurt','dead','downTimer','rescue','boostCooldown','inWater','turn'];
function packPlayer(p){return PLAYER_FIELDS.map(k=>p[k]??null);}
function unpackPlayer(a){if(!Array.isArray(a))return {...a,trail:[]};const p=player(a[0],a[1],a[2]);PLAYER_FIELDS.forEach((k,i)=>p[k]=a[i]);return p;}
function mask(items,key){let out='';for(let i=0;i<items.length;i+=4){let bits=0;for(let j=0;j<4;j++)if(items[i+j]?.[key])bits|=1<<j;out+=bits.toString(16);}return out;}
function marked(value,i){return !!(parseInt(value[i>>2]||'0',16)&1<<(i&3));}
function packWorld(w){return{
 time:w.time,teamCount:w.teamCount,deaths:w.deaths,completed:w.completed,cp:w.cp,coinCount:w.coinCount,appleCount:w.appleCount,secretCount:w.secretCount,
 coins:mask(w.coins,'taken'),apples:mask(w.apples,'taken'),secrets:mask(w.secrets,'taken'),
 crates:mask(w.crates,'broken'),boxes:w.crates.flatMap((q,i)=>q.movable?[[i,q.x]]:[]),checkpoints:mask(w.checkpoints,'lit'),
 platforms:w.platforms.filter(q=>['moving','cart','crumble','switch','coop'].includes(q.kind)).map(q=>[q.id,q.x,q.y,q.dx||0,q.dy||0,q.collapse||0,q.restore||0,+!!q.enabled,q.hold||0]),
 saws:w.saws.map(q=>q.y),enemies:w.enemies.map(q=>[q.x,q.y,q.dir,+q.alive,q.state,q.timer,q.death||0]),
 switches:w.switches.map(q=>[+q.active,q.timer]),boss:w.boss,chaser:w.chaser};}
function applyWorld(w,q){
 for(const k of ['time','teamCount','deaths','completed','cp','coinCount','appleCount','secretCount'])w[k]=q[k];
 for(const k of ['coins','apples','secrets'])w[k].forEach((v,i)=>v.taken=marked(q[k],i));
 w.crates.forEach((v,i)=>v.broken=marked(q.crates,i));for(const [i,x]of q.boxes||[])if(w.crates[i]?.movable)w.crates[i].x=x;w.checkpoints.forEach((v,i)=>v.lit=marked(q.checkpoints,i));
 const byId=new Map(w.platforms.map(v=>[v.id,v]));for(const a of q.platforms){const v=byId.get(a[0]);if(v){[,v.x,v.y,v.dx,v.dy,v.collapse,v.restore]=a;v.enabled=!!a[7];v.hold=a[8]||0;}}
 w.saws.forEach((v,i)=>v.y=q.saws[i]);w.enemies.forEach((v,i)=>{[v.x,v.y,v.dir,v.alive,v.state,v.timer,v.death]=q.enemies[i];v.alive=!!v.alive;});
 w.switches.forEach((v,i)=>{v.active=!!q.switches[i][0];v.timer=q.switches[i][1];});w.boss=q.boss?JSON.parse(JSON.stringify(q.boss)):null;w.chaser=q.chaser?{...q.chaser}:null;
}
return{packPlayer,unpackPlayer,packWorld,applyWorld,worldTick,STEP,G,roles,themes,LEVEL_COUNT,BOSSES,clamp,approach,rect,overlaps,level,player,switchRole,hurt,respawn,motion,tick,snapshot,restore,usablePlatforms};
})();
export default Adventure;
