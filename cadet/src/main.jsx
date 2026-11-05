// Entry point. Build with `npm run build`, then load dist/cadet.js + dist/cadet.css in the portfolio and
// mount the game into a window body:  const off = window.CADET.mount(win.querySelector('.content'));
import React from 'react';
import { createRoot } from 'react-dom/client';
import GameEngine from './GameEngine';

export function mountCadet(el) {
  const root = createRoot(el);
  root.render(<GameEngine />);
  return () => root.unmount();                  // call this when the OS window closes
}
window.CADET = { mount: mountCadet, title: 'CADET.EXE - Connected to 1337 Network' };
