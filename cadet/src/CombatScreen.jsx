import React, { useEffect, useState } from 'react';
import { MAX_HP, SPELLS, QUICK_MS, newBattle, resolveTurn, pickQuestion } from './combat';

/** Turn-based battle. Enemy HP = failing test cases. `write` opens a quick-time C riddle for a critical hit. */
export default function CombatScreen({ enemy, questions, hp, onHp, onFinish }) {
  const [b, setB] = useState(() => newBattle(enemy));
  const [quiz, setQuiz] = useState(null);                       // { q, left }
  const over = b.won !== null;

  const resolve = (spell, correct, note) => { const r = resolveTurn(b, spell, correct, hp, note); setB(r.battle); onHp(r.hp); };
  const cast = spell => {
    if (over || quiz) return;
    if (spell === 'write') setQuiz({ q: pickQuestion(questions), left: Math.round(QUICK_MS / 1000) });
    else resolve(spell, false);
  };
  const answer = i => {
    if (!quiz) return;
    const ok = i === quiz.q.answer;
    setQuiz(null);
    resolve('write', ok, `${ok ? 'Correct!' : 'Wrong.'} ${quiz.q.explain}`);
  };
  useEffect(() => {                                              // countdown; running out counts as wrong
    if (!quiz) return;
    if (quiz.left <= 0) { answer(-1); return; }
    const t = setTimeout(() => setQuiz(q => q && { ...q, left: q.left - 1 }), 1000);
    return () => clearTimeout(t);
  }, [quiz]);

  const tests = Array.from({ length: enemy.hp }, (_, i) => (i < b.enemyHp ? '[X]' : '[ ]')).join('');
  return (
    <div className="cdt-battle">
      <div className="cdt-foe">
        <pre className="cdt-sprite" aria-hidden="true">{`+-------+\n|  ${enemy.glyph.padEnd(3)}  |\n+-------+`}</pre>
        <div>
          <b>{enemy.name}</b>{b.buff && <span className="cdt-tag">{b.buff}</span>}{b.leak && <span className="cdt-tag">leaking</span>}
          <div>Failing tests: <code>{tests}</code> {b.enemyHp}/{enemy.hp}</div>
          <small>{b.scanned ? `Weakness: ${enemy.weakness}()` : enemy.blurb}</small>
        </div>
      </div>

      <div className="cdt-log" aria-live="polite">{b.log.map((l, i) => <div key={i}>&gt; {l}</div>)}</div>
      <div>Memory: <code>{'#'.repeat(Math.ceil(hp / 3)).padEnd(MAX_HP / 3, '.')}</code> {hp}/{MAX_HP}{b.shield && ' [shield]'}</div>

      {quiz && (
        <div className="cdt-quiz" role="group" aria-label="Quick-time riddle">
          <b>{quiz.left}s</b> {quiz.q.q}
          {quiz.q.options.map((o, i) => <button key={i} onClick={() => answer(i)}>{String.fromCharCode(65 + i)}) {o}</button>)}
        </div>
      )}

      {!over && !quiz && (
        <div className="cdt-spells">
          {SPELLS.map(s => (
            <button key={s.id} onClick={() => cast(s.id)} disabled={s.id === 'valgrind' && b.scanUsed} title={s.desc}>{s.label}</button>
          ))}
        </div>
      )}
      {over && <button className="cdt-go" onClick={() => onFinish(b.won)}>[ Continue ]</button>}
    </div>
  );
}
