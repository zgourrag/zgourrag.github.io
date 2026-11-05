import React, { useEffect, useRef } from 'react';

const COLORS = { '#': '#1b1b2f', '.': '#2d3142', g: '#1f5f3a', c: '#6b4423', t: '#0a3d62', P: '#5b2a86',
                 m: '#4a4e69', z: '#3d405b', B: '#8b1a1a', e: '#14532d', 1: '#7a4b00', 2: '#7a4b00', 3: '#7a4b00' };
const GLYPH = { c: 'C', t: '>_', P: 'O', m: '[]', z: '~', B: 'X', e: '<', g: '"', 1: '1', 2: '2', 3: '3' };
const EYES = { up: [0, -3], down: [0, 3], left: [-3, 0], right: [3, 0] };

/** Draws the tile map, patrolling drones and the player on a canvas. Redraws on every render. */
export default function MapRenderer({ map, player, facing, entities = [] }) {
  const ref = useRef(null);
  const T = map.tileSize || 32, W = map.rows[0].length, H = map.rows.length;

  useEffect(() => {
    const ctx = ref.current.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${Math.round(T * 0.62)}px "VT323", "Courier New", monospace`;

    map.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      ctx.fillStyle = COLORS[ch] || COLORS['.'];
      ctx.fillRect(x * T, y * T, T, T);
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeRect(x * T + .5, y * T + .5, T - 1, T - 1);
      if (GLYPH[ch]) { ctx.fillStyle = '#e6f0e6'; ctx.fillText(GLYPH[ch], x * T + T / 2, y * T + T / 2 + 1); }
    }));

    entities.forEach(e => {                                   // Norminette Drones: red diamonds
      const cx = e.x * T + T / 2, cy = e.y * T + T / 2, r = T * 0.36;
      ctx.fillStyle = '#d7263d'; ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('N', cx, cy + 1);
    });

    const px = player.x * T, py = player.y * T, [ex, ey] = EYES[facing] || EYES.down;   // the cadet
    ctx.fillStyle = '#46d4e8'; ctx.fillRect(px + 6, py + 4, T - 12, T - 8);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(px + T / 2 - 6 + ex, py + T / 2 - 4 + ey, 3, 3);
    ctx.fillRect(px + T / 2 + 3 + ex, py + T / 2 - 4 + ey, 3, 3);
  });

  return <canvas ref={ref} className="cdt-map" width={W * T} height={H * T} role="img" aria-label={`Map: ${map.name}`} />;
}
