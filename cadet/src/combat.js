// Pure battle rules (no React, no DOM) so they are easy to test and tweak.
export const MAX_HP = 30;          // player "memory integrity"
export const QUICK_MS = 10000;     // time to answer a critical-hit riddle

export const SPELLS = [
  { id: 'write',    label: 'write(1, ...)',               desc: 'Basic attack. Answer the riddle for a critical hit.' },
  { id: 'malloc',   label: 'malloc(size)',                desc: 'Memory shield: blocks the next attack.' },
  { id: 'free',     label: 'free(ptr)',                   desc: 'Clears enemy buffs, plugs leaks, heals 3.' },
  { id: 'valgrind', label: 'valgrind --leak-check=full',  desc: 'Reveals the enemy weakness. Once per fight.' }
];

export const fmtTime = ms => { const s = Math.round(ms / 1000); return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };
export const pickQuestion = (qs, rng = Math.random) => qs[Math.floor(rng() * qs.length)];
const trim = log => log.slice(-7);

export function newBattle(enemy) {
  return {
    enemy, enemyHp: enemy.hp,                // enemy HP = failing test cases
    buff: enemy.buff || null,                // 'regen' | 'armor' | null
    shield: false, scanned: false, scanUsed: false, leak: false,
    won: null,                               // null = ongoing, true = player won, false = player lost
    log: [`A wild ${enemy.name} appears! ${enemy.hp}/${enemy.hp} tests failing.`]
  };
}

/** One full round: the player's spell, then (if the enemy survives) the enemy's turn. */
export function resolveTurn(b, spell, correct = false, hp = MAX_HP, note = '') {
  const e = b.enemy, log = note ? [note] : [];
  let { enemyHp, buff, shield, scanned, scanUsed, leak } = b, newHp = hp;

  if (spell === 'valgrind' && scanUsed) return { battle: { ...b, log: trim([...b.log, 'valgrind already ran this fight.']) }, hp };

  if (spell === 'write') {
    let dmg = correct ? 2 : 1;
    if (scanned && e.weakness === 'write') dmg += 1;
    if (buff === 'armor') dmg = Math.max(1, dmg - 1);
    enemyHp = Math.max(0, enemyHp - dmg);
    log.push(`${correct ? 'CRITICAL HIT! ' : ''}write(1, ...) fixes ${dmg} test${dmg > 1 ? 's' : ''}.`);
  } else if (spell === 'malloc') {
    shield = true;
    if (scanned && e.weakness === 'malloc') { enemyHp = Math.max(0, enemyHp - 2); log.push('malloc() boxes the enemy in: 2 tests fixed. Shield up.'); }
    else log.push('malloc() raises a memory shield.');
  } else if (spell === 'free') {
    buff = null; leak = false; newHp = Math.min(MAX_HP, newHp + 3);
    if (scanned && e.weakness === 'free') { enemyHp = Math.max(0, enemyHp - 2); log.push('free() releases the enemy: 2 tests fixed. +3 memory.'); }
    else log.push('free() clears buffs and plugs leaks. +3 memory.');
  } else if (spell === 'valgrind') {
    scanned = true; scanUsed = true; log.push(`valgrind finds the weakness: ${e.weakness}()`);
  }

  const base = { ...b, enemyHp, buff, shield, scanned, scanUsed, leak };
  if (enemyHp <= 0) return { battle: { ...base, won: true, log: trim([...b.log, ...log, `${e.name} debugged! 0 tests failing.`]) }, hp: newHp };

  // enemy turn
  if (buff === 'regen') { enemyHp = Math.min(e.hp, enemyHp + 1); log.push(`${e.name} regenerates 1 test.`); }
  if (leak) { newHp -= 1; log.push('Memory leaks away: -1 memory.'); }
  if (shield) { shield = false; log.push(`${e.name} attacks, but the shield absorbs it.`); }
  else { newHp -= e.atk; log.push(`${e.name} hits for ${e.atk}.`); if (e.leaks) leak = true; }

  const lost = newHp <= 0;
  if (lost) log.push('Segmentation fault. Your memory is corrupted.');
  return { battle: { ...base, enemyHp, shield, leak, won: lost ? false : null, log: trim([...b.log, ...log]) }, hp: Math.max(0, newHp) };
}
