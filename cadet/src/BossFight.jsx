import React, { useEffect, useState } from 'react';
import { fmtTime } from './combat';

/** The Mouinette: find the line with the hidden segfault before the timer runs out. */
export default function BossFight({ boss, onFinish }) {
  const [snip] = useState(() => boss.snippets[Math.floor(Math.random() * boss.snippets.length)]);
  const [left, setLeft] = useState(boss.timeLimitMs);
  const [bad, setBad] = useState([]);
  const [result, setResult] = useState(null);                   // null | 'win' | 'lose'

  useEffect(() => {
    if (result) return;
    const t = setInterval(() => setLeft(l => Math.max(0, l - 100)), 100);
    return () => clearInterval(t);
  }, [result]);
  useEffect(() => { if (left <= 0 && !result) setResult('lose'); }, [left, result]);

  const pick = n => {
    if (result) return;
    if (n === snip.bugLine) setResult('win');
    else { setBad(b => [...b, n]); setLeft(l => Math.max(0, l - (boss.wrongPenaltyMs || 5000))); }   // wrong click costs time
  };

  return (
    <div className="cdt-battle cdt-boss">
      <pre className="cdt-sprite" aria-hidden="true">{`  BOSS: ${boss.name}\n  (disguised as ${boss.alias})`}</pre>
      <p>{boss.intro}</p>
      <div className={`cdt-timer${left < 10000 ? ' low' : ''}`} role="timer">{fmtTime(left)} left</div>
      <div className="cdt-code">
        {snip.lines.map((t, i) => {
          const n = i + 1, cls = result && n === snip.bugLine ? 'good' : bad.includes(n) ? 'bad' : '';
          return <button key={i} className={cls} disabled={!!result} onClick={() => pick(n)}><i>{n}</i>{t}</button>;
        })}
      </div>
      {result && (
        <>
          <p>{result === 'win' ? 'SEGFAULT FOUND! ' : 'Time is up. '}{snip.explain}</p>
          <button className="cdt-go" onClick={() => onFinish(result === 'win', left)}>[ Continue ]</button>
        </>
      )}
    </div>
  );
}
