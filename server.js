import http from 'node:http';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { WebSocketServer, WebSocket } from 'ws';
import Core from './core.js';

const PORT = Number(process.env.PORT) || 10000;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const EMPTY = () => ({ axis: 0, jumpHeld: false, jumpPress: false, skillPress: false, skillHeld:false });
const rooms = new Map();
const code = () => Array.from(crypto.randomBytes(6), n => CHARSET[n % CHARSET.length]).join('');

function allowedOrigin(origin) {
  if (!origin) return true;
  if (/^https:\/\/[\w-]+\.netlify\.app$/i.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  return (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).includes(origin);
}
const cors = origin => ({
  'access-control-allow-origin': origin || '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'Origin'
});
function reply(res, body, status = 200, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
function publicRoster(r) {
  return { t: 'roster', code: r.code, phase: r.phase, level: r.level,
    slots: r.slots.map(s => s && ({ name: s.name, role: s.role, ready: s.ready, connected: s.connected })),
    host: r.slots.findIndex(s => s?.token === r.owner) };
}
function frame(r, events = []) {
  return { t:'frame', epoch:r.epoch, tick:r.tick, phase:r.phase, level:r.level,
    w:Core.packWorld(r.world),
    ps:r.players.map(Core.packPlayer),
    ack:r.inputState.map(s=>({seq:s.seq,steps:s.steps})),e:events };
}
const encode=body=>JSON.stringify(body,(_k,v)=>typeof v==='number'&&!Number.isInteger(v)?Math.round(v*1000)/1000:v);
function send(ws,body){if(ws?.readyState===WebSocket.OPEN)ws.send(encode(body));}
function broadcast(r,body){const text=encode(body);for(const ws of r.clients.values())if(ws.readyState===WebSocket.OPEN&&(body.phase==='completed'||ws.bufferedAmount<32768))ws.send(text);}
function broadcastRoster(r) {
  const roster = publicRoster(r);
  for (const [token, ws] of r.clients) send(ws, { ...roster, you: r.slots.findIndex(s => s?.token === token) });
}
function stop(r) { if (r.timer) clearInterval(r.timer); r.timer=null;r.inputs=[EMPTY(),EMPTY()]; }
function syncTimer(r) {
  const live=r.phase==='playing'&&r.slots.every(s=>s?.connected);
  if(!live)return stop(r);
  if(!r.timer){r.lastTime=performance.now();r.accumulator=0;r.timer=setInterval(()=>advance(r),16);}
}
function advance(r) {
  if(r.phase!=='playing'||Date.now()-r.created>4*60*60*1000)return stop(r);
  const now=performance.now(),elapsed=Math.max(0,Math.min(.15,(now-r.lastTime)/1000));r.lastTime=now;r.accumulator+=elapsed;
  let count=0;
  while(r.accumulator>=Core.STEP&&count++<18){
    for(let i=0;i<2;i++)if(now-r.inputState[i].received>600)r.inputs[i]=EMPTY();
    r.events.push(...Core.tick(r.world,r.players,r.inputs,Core.STEP));r.tick++;r.accumulator-=Core.STEP;
    for(let i=0;i<2;i++){r.inputState[i].steps++;r.inputs[i].jumpPress=false;r.inputs[i].skillPress=false;}
    if(r.world.completed)break;
  }
  if(r.world.completed)r.phase='completed';
  if(r.tick-r.lastFrameTick>=4||r.world.completed){r.lastFrameTick=r.tick;broadcast(r,frame(r,r.events.splice(0)));}
  if(r.world.completed){stop(r);broadcastRoster(r);}
}
function remove(r, token) {
  const i = r.slots.findIndex(s => s?.token === token);
  if (i < 0) return;
  r.clients.delete(token); r.slots[i] = null;
  if (r.owner === token) r.owner = r.slots.find(s => s)?.token || null;
  if (r.phase !== 'lobby') { r.phase = 'lobby'; r.world = null; r.players = null; r.slots.forEach(s => { if (s) s.ready = false; }); }
  syncTimer(r); broadcastRoster(r);
}
function onMessage(r, token, raw) {
  if (typeof raw !== 'string' || raw.length > 800) return;
  const i = r.slots.findIndex(s => s?.token === token);
  if (i < 0) return;
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  const slot = r.slots[i];
  if(msg.t==='ping'&&Number.isFinite(msg.id)){send(r.clients.get(token),{t:'pong',id:msg.id});return;}
  if (msg.t === 'input' && r.phase === 'playing') {
    if(msg.epoch!==r.epoch||!Number.isSafeInteger(msg.seq)||msg.seq<0||msg.seq<=r.inputState[i].seq)return;
    const axis = Number(msg.axis);
    r.inputState[i]={seq:msg.seq,steps:0,received:performance.now()};
    r.inputs[i] = { axis: Number.isFinite(axis) ? Core.clamp(axis, -1, 1) : 0,
      jumpHeld: !!msg.jumpHeld, jumpPress: r.inputs[i].jumpPress || msg.jumpPress === true,
      skillPress: r.inputs[i].skillPress || msg.skillPress === true,skillHeld:!!msg.skillHeld };
  } else if (msg.t === 'role' && Number.isInteger(msg.role) && msg.role >= 0 && msg.role < 3) {
    if (r.phase === 'lobby' || r.phase === 'completed') {
      if (!r.slots.some((s, j) => j !== i && s?.role === msg.role)) { slot.role = msg.role; slot.ready = false; broadcastRoster(r); }
    } else if (!r.slots.some((s, j) => j !== i && s?.role === msg.role) && Core.switchRole(r.players[i], msg.role, r.world)) {
      slot.role = msg.role; broadcast(r, frame(r, r.world.events.splice(0)));
    }
  } else if (msg.t === 'ready' && r.phase === 'lobby') {
    slot.ready = !!msg.ready; broadcastRoster(r);
  } else if (msg.t === 'level' && r.phase === 'lobby' && r.owner === token && Number.isInteger(msg.level) && msg.level >= 0 && msg.level < Core.LEVEL_COUNT) {
    r.level = msg.level; r.slots.forEach(s => { if (s) s.ready = false; }); broadcastRoster(r);
  } else if (msg.t === 'start' && r.phase === 'lobby' && r.owner === token) {
    if (!r.slots.every(s => s?.connected && s.ready) || r.slots[0].role === r.slots[1].role) return send(r.clients.get(token), { t: 'error', error: '两位不同角色的伙伴都在线并准备后才能开始。' });
    r.world = Core.level(r.level); r.world.cameraWidth=1300;r.world.teamCount=2;
    r.players = r.slots.map((s, j) => Core.player(s.role, r.world.start.x + j * 62, r.world.start.y));
    r.epoch++;r.tick=0;r.lastFrameTick=0;r.events=[];r.inputState=[0,1].map(()=>({seq:-1,steps:0,received:performance.now()}));
    r.phase = 'playing'; broadcastRoster(r); broadcast(r, frame(r)); syncTimer(r);
  } else if (msg.t === 'rematch' && r.phase === 'completed' && r.owner === token) {
    r.phase = 'lobby'; r.world = null; r.players = null; r.slots.forEach(s => { if (s) s.ready = false; }); broadcastRoster(r);
  } else if (msg.t === 'leave') remove(r, token);
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (!allowedOrigin(origin)) return reply(res, { error: '此网站来源未获准使用服务器。' }, 403);
  const headers = cors(origin), url = new URL(req.url, 'http://server');
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end(); }
  if (url.pathname === '/' && req.method === 'GET') return reply(res, {
    ok: true,
    game: 'little-adventurers',
    version: '7.0',
    protocol: 7,
    host: 'render',
    message: '熊喵喵联机服务器已启动'
  }, 200, headers);
  if (url.pathname === '/api/health') return reply(res, { ok: true, game: 'little-adventurers', version: '7.0', protocol: 7, host: 'render', levels: Core.LEVEL_COUNT,simulationHz:120,snapshotHz:30,region:process.env.SERVER_REGION||process.env.RENDER_REGION||'未设置' }, 200, headers);
  if (url.pathname === '/favicon.ico') { res.writeHead(204, headers); return res.end(); }
  if (url.pathname === '/api/rooms' && req.method === 'POST') {
    let roomCode; do roomCode = code(); while (rooms.has(roomCode));
    const token = crypto.randomUUID();
    rooms.set(roomCode, { code: roomCode, created: Date.now(), owner: token, phase: 'lobby', level: 0,
      slots: [{ token, name: '房主', role: 0, ready: false, connected: false }, null], clients: new Map(),
      epoch:0,tick:0,lastFrameTick:0,events:[],inputState:[0,1].map(()=>({seq:-1,steps:0,received:performance.now()})),inputs: [EMPTY(), EMPTY()], timer: null, world: null, players: null });
    return reply(res, { code: roomCode, token }, 201, headers);
  }
  const match = url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})$/);
  if (match && req.method === 'GET') {
    const r = rooms.get(match[1]);
    if (!r || Date.now() - r.created > 4 * 60 * 60 * 1000) return reply(res, { error: '房间不存在或已过期。' }, 404, headers);
    return reply(res, publicRoster(r), 200, headers);
  }
  reply(res, { error: '接口不存在。' }, 404, headers);
});

const wss = new WebSocketServer({ noServer:true,perMessageDeflate:false,maxPayload:2048 });
server.on('upgrade', (req, socket, head) => {
  const origin = req.headers.origin, url = new URL(req.url, 'http://server');
  const match = url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{6})\/socket$/), r = match && rooms.get(match[1]);
  if (!allowedOrigin(origin) || !r || Date.now() - r.created > 4 * 60 * 60 * 1000) return socket.destroy();
  const token = url.searchParams.get('token');
  if (!token || token.length > 100) return socket.destroy();
  let i = r.slots.findIndex(s => s?.token === token);
  if (i < 0) {
    if (!['lobby', 'completed'].includes(r.phase)) return socket.destroy();
    i = r.slots.findIndex(s => !s); if (i < 0) return socket.destroy();
    const name = (url.searchParams.get('name') || '伙伴').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 12) || '伙伴';
    r.slots[i] = { token, name, role: r.slots[1 - i]?.role === 0 ? 1 : 0, ready: false, connected: true };
  }
  socket.setNoDelay(true);
  wss.handleUpgrade(req, socket, head, ws => {
    const old = r.clients.get(token); if (old) old.close(4001, '在另一设备重新连接');
    r.clients.set(token, ws); r.slots[i].connected = true;
    send(ws, { t: 'welcome', code: r.code, you: i, token }); broadcastRoster(r); if (r.world) send(ws, frame(r)); syncTimer(r);
    ws.on('message', data => onMessage(r, token, data.toString()));
    ws.on('close', () => { if (r.clients.get(token) !== ws) return; r.clients.delete(token); const s = r.slots.find(q => q?.token === token); if (s) s.connected = false; syncTimer(r); broadcastRoster(r); });
    ws.on('error', () => {});
  });
});

setInterval(() => { for (const [key, r] of rooms) if (Date.now() - r.created > 4 * 60 * 60 * 1000) { stop(r); for (const ws of r.clients.values()) ws.close(1000, '房间已过期'); rooms.delete(key); } }, 60_000).unref();
server.listen(PORT, '0.0.0.0', () => console.log(`熊喵喵 V7 room server listening on ${PORT}`));
