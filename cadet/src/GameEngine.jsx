import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCadet } from './store';
import { MAX_HP, fmtTime } from './combat';
import MapRenderer from './MapRenderer';
import CombatScreen from './CombatScreen';
import BossFight from './BossFight';
import { HANDLE_RE, isOnline, registerCadet, submitScore, fetchRecentClears, subscribe } from './supabaseClient';
import world from './data/world.json';
import libft from './data/libft.json';
import './cadet.css';

const MAPS = { world, libft };                 // add gnl / push_swap here when their JSON exists
const QUESTIONS = libft.questions;             // riddle pool for random battles
const SOLID = new Set(['#', 'm']);
const KEYS = { arrowup: [0, -1, 'up'], w: [0, -1, 'up'], arrowdown: [0, 1, 'down'], s: [0, 1, 'down'],
               arrowleft: [-1, 0, 'left'], a: [-1, 0, 'left'], arrowright: [1, 0, 'right'], d: [1, 0, 'right'] };
const tileAt = (m, x, y) => m.rows[y]?.[x] ?? '#';
const fmtEvent = r => ({ id: r.id ?? `local-${Date.now()}`, text: `[${r.handle}] just cleared ${r.dungeon_name} in ${fmtTime(r.clear_time_ms)}!` });

function BootScreen({ onDone }) {
  const [handle, setHandle] = useState('');
  const [campus, setCampus] = useState('1337 Khouribga');
  const ok = HANDLE_RE.test(handle);
  return (
    <form className="cdt-boot" onSubmit={e => { e.preventDefault(); if (ok) onDone(handle, campus); }}>
      <pre>{'CADET.EXE  (Cluster Crawler)\nConnecting to the 42 Network...'}</pre>
      <label htmlFor="cdt-handle">Enter your 1337 handle:</label>
      <input id="cdt-handle" value={handle} maxLength={20} autoFocus autoComplete="off" spellCheck={false}
             onChange={e => setHandle(e.target.value)} />
      <select aria-label="Starting campus" value={campus} onChange={e => setCampus(e.target.value)}>
        <option>1337 Khouribga</option><option>1337 Ben Guerir</option>
      </select>
      <button type="submit" disabled={!ok}>[ Connect ]</button>
      <small>2-20 letters, digits, - or _. No password: your handle is saved in this browser.</small>
    </form>
  );
}

/** Live ticker of other cadets clearing dungeons (Supabase real-time, or just local events when offline). */
function FeedOverlay({ local }) {
  const [remote, setRemote] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchRecentClears(4).then(rows => alive && setRemote(rows.map(fmtEvent)));
    const off = subscribe('leaderboards', row => setRemote(f => [fmtEvent(row), ...f.filter(x => x.id !== row.id)].slice(0, 4)));
    return () => { alive = false; off(); };
  }, []);
  const items = [...local, ...remote].slice(0, 4);
  return <div className="cdt-feed" aria-live="polite">{items.length ? items.map(i => <div key={i.id}>{i.text}</div>) : <div>No clears yet. Be the first.</div>}</div>;
}

export default function GameEngine() {
  const { handle, campus, loc, facing, hp, xp, inventory } = useCadet();
  const [battle, setBattle] = useState(null);            // { kind: 'combat', enemy } | { kind: 'boss', boss }
  const [toast, setToast] = useState('');
  const [, setTick] = useState(0);
  const [localFeed, setLocalFeed] = useState([]);
  const rootRef = useRef(null), battleRef = useRef(null);
  const drones = useRef(world.drones.map(d => ({ id: d.id, i: 0 })));
  battleRef.current = battle;
  const map = MAPS[loc.z] || world;

  const say = useCallback(msg => setToast(msg), []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 5000); return () => clearTimeout(t); }, [toast]);

  // register the cadet once a handle exists (idempotent upsert) and resume the dungeon timer after a reload
  useEffect(() => {
    if (!handle) return;
    registerCadet({ handle, campus, avatar_sprite: useCadet.getState().avatar });
    if (useCadet.getState().loc.z !== 'world' && !useCadet.getState().runStartedAt) useCadet.setState({ runStartedAt: Date.now() });
  }, [handle]);

  const startCombat = useCallback(enemy => { setBattle({ kind: 'combat', enemy, id: Date.now() }); setToast(''); }, []);
  const startBoss = useCallback(boss => { setBattle({ kind: 'boss', boss, id: Date.now() }); setToast(''); }, []);

  const droneAt = (x, y) => world.drones.some(dr => { const [dx, dy] = dr.path[drones.current.find(s => s.id === dr.id).i]; return dx === x && dy === y; });

  // ---- tile effects -----------------------------------------------------------------------
  const onTile = useCallback((t, x, y, m) => {
    const st = useCadet.getState();
    if (m.id === 'world' && droneAt(x, y)) return startCombat(world.enemies.drone);
    if (t === 'g') {
      if (Math.random() < (m.encounterRate ?? 0.2)) {
        const table = m.encounterTable;
        const enemy = table ? m.enemies[table[Math.floor(Math.random() * table.length)]] : world.enemies.drone;
        startCombat(enemy);
      }
    } else if (t === 'c') {
      say(st.tryCoffee() ? 'Coffee! Memory fully restored.' : 'The machine is still brewing...');
    } else if (t === 'P') {
      const target = m.teleporters?.[`${x},${y}`];
      if (target) { st.setCampus(target); say(`Teleported to ${target}.`); }
    } else if (t === 'e') {
      st.teleport('world', m.returnTo.x, m.returnTo.y); say('You climb out of the dungeon.');
    } else if (t === 'B') {
      if (st.hasBadge(m.badge)) say('Already cleared. The Mouinette nods.'); else startBoss(m.boss);
    } else if (m.doors?.[`${x},${y}`]) {
      const door = m.doors[`${x},${y}`], d = world.dungeons.find(q => q.id === door.dungeon);
      if (!d.available) say(`${d.name} is still being compiled...`);
      else if (door.requires && !st.hasBadge(door.requires)) say(`Locked. Earn ${door.requires} first.`);
      else { const dm = MAPS[door.dungeon]; st.teleport(door.dungeon, dm.spawn.x, dm.spawn.y); say(`Entering ${d.name}. Boss: ${d.boss}.`); }
    }
  }, [say, startCombat, startBoss]);

  const step = useCallback((dx, dy, face) => {
    if (battleRef.current) return;
    const st = useCadet.getState(); if (!st.handle) return;
    const m = MAPS[st.loc.z] || world, nx = st.loc.x + dx, ny = st.loc.y + dy, t = tileAt(m, nx, ny);
    if (SOLID.has(t)) { st.moveTo(st.loc.x, st.loc.y, face); return; }
    st.moveTo(nx, ny, face);
    onTile(t, nx, ny, m);
  }, [onTile]);

  const interact = useCallback(() => {                   // Enter: read the terminal under or in front of you
    if (battleRef.current) return;
    const st = useCadet.getState(), m = MAPS[st.loc.z] || world, [dx, dy] = Object.values(KEYS).find(k => k[2] === st.facing);
    for (const [x, y] of [[st.loc.x, st.loc.y], [st.loc.x + dx, st.loc.y + dy]]) {
      const text = m.terminals?.[`${x},${y}`]; if (text) return say(text);
    }
    say('Nothing to interact with here.');
  }, [say]);

  // ---- keyboard ---------------------------------------------------------------------------
  useEffect(() => {
    const el = rootRef.current; if (!el) return;
    el.focus();
    let last = 0;
    const onKey = e => {
      const k = e.key.toLowerCase();
      if (KEYS[k]) { e.preventDefault(); const now = performance.now(); if (now - last < 100) return; last = now; step(...KEYS[k]); }
      else if (k === 'enter') { e.preventDefault(); interact(); }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [step, interact, handle]);

  // ---- patrolling Norminette Drones -------------------------------------------------------
  useEffect(() => {
    const t = setInterval(() => {
      const st = useCadet.getState();
      if (battleRef.current || st.loc.z !== 'world' || !st.handle) return;
      drones.current.forEach(d => { d.i = (d.i + 1) % world.drones.find(x => x.id === d.id).path.length; });
      setTick(n => n + 1);
      if (droneAt(st.loc.x, st.loc.y)) startCombat(world.enemies.drone);
    }, 450);
    return () => clearInterval(t);
  }, [startCombat]);

  // ---- battle results ---------------------------------------------------------------------
  const finishCombat = won => {
    const st = useCadet.getState(), e = battle.enemy;
    if (won) { st.gainXp(e.xp); say(`${e.name} debugged! +${e.xp} XP`); }
    else { st.respawn(); say('Your memory was corrupted. You wake up at spawn.'); }
    setBattle(null);
  };
  const finishBoss = (won, left) => {
    const st = useCadet.getState(), m = MAPS[st.loc.z], b = m.boss;
    if (won) {
      const timeMs = Math.max(15000, Date.now() - (st.runStartedAt || Date.now()));
      const score = Math.max(0, 5000 - Math.floor(timeMs / 100)) + st.hp * 10 + Math.floor(left / 100);
      const row = { handle: st.handle, dungeon_name: m.name, clear_time_ms: timeMs, score };
      st.addBadge(m.badge); st.gainXp(b.xp);
      submitScore(row);                                   // the real-time feed echoes it back to every device
      if (!isOnline) setLocalFeed(f => [fmtEvent(row), ...f].slice(0, 4));
      say(`Badge earned: ${m.badge}! +${b.xp} XP. Cleared in ${fmtTime(timeMs)}.`);
    } else { st.setHp(10); say('The Mouinette devoured your commit. You stagger out.'); }
    st.teleport('world', m.returnTo.x, m.returnTo.y);
    setBattle(null);
  };

  if (!handle) return <div className="cdt" ref={rootRef} tabIndex={0}><BootScreen onDone={(h, c) => useCadet.getState().setIdentity(h, c)} /></div>;

  const ents = loc.z === 'world' ? world.drones.map(dr => { const [x, y] = dr.path[drones.current.find(s => s.id === dr.id).i]; return { x, y }; }) : [];
  return (
    <div className="cdt" ref={rootRef} tabIndex={0} role="application" aria-label="CADET.EXE game">
      <div className="cdt-hud">
        <span>{handle}@{campus}</span>
        <span>HP {hp}/{MAX_HP}</span><span>XP {xp}</span>
        <span>Badges: {inventory.badges.length ? inventory.badges.join(', ') : 'none'}</span>
        <span>{map.name} ({loc.x},{loc.y},{loc.z})</span>
      </div>
      <div className="cdt-stage">
        {!battle && <MapRenderer map={map} player={loc} facing={facing} entities={ents} />}
        {battle?.kind === 'combat' && <CombatScreen key={battle.id} enemy={battle.enemy} questions={QUESTIONS}
            hp={hp} onHp={n => useCadet.getState().setHp(n)} onFinish={finishCombat} />}
        {battle?.kind === 'boss' && <BossFight boss={battle.boss} onFinish={finishBoss} />}
        <FeedOverlay local={localFeed} />
      </div>
      <div className="cdt-say" aria-live="polite">{toast || 'WASD / arrows to move, Enter to interact. Tall grass hides bugs.'}</div>
      <div className="cdt-dpad">
        <button aria-label="Up" onClick={() => step(0, -1, 'up')}>^</button>
        <button aria-label="Left" onClick={() => step(-1, 0, 'left')}>&lt;</button>
        <button aria-label="Interact" onClick={interact}>E</button>
        <button aria-label="Right" onClick={() => step(1, 0, 'right')}>&gt;</button>
        <button aria-label="Down" onClick={() => step(0, 1, 'down')}>v</button>
      </div>
      <div className="cdt-crt" aria-hidden="true" />
    </div>
  );
}
