// Supabase client + real-time helpers. No passwords: the anon key is public by design and
// Row Level Security (schema.sql) limits what it can do. Set the config before loading the bundle:
//   <script>window.CADET_CONFIG = { supabaseUrl: 'https://xxxx.supabase.co', supabaseKey: 'anon-key' };</script>
// (or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time).
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const cfg = (typeof window !== 'undefined' && window.CADET_CONFIG) || {};
const URL = cfg.supabaseUrl || import.meta.env?.VITE_SUPABASE_URL;
const KEY = cfg.supabaseKey || import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const supabase = URL && KEY
  ? createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 10 } } })
  : null;
export const isOnline = !!supabase;          // false = the game still runs, just without global sync

export const HANDLE_RE = /^[A-Za-z0-9_-]{2,20}$/;

const run = async q => { try { const { data, error } = await q; if (error) throw error; return data ?? []; } catch (e) { console.warn('[cadet] supabase:', e.message || e); return []; } };

// ---- writes -------------------------------------------------------------------------------
export const registerCadet = ({ handle, campus, avatar_sprite }) =>
  supabase && run(supabase.from('cadets').upsert({ handle, campus, avatar_sprite }, { onConflict: 'handle', ignoreDuplicates: true }));

export const submitScore = ({ handle, dungeon_name, clear_time_ms, score }) =>
  supabase && run(supabase.from('leaderboards').insert({ handle, dungeon_name, clear_time_ms, score }));

export const postWallNote = ({ handle, message, x_pos, y_pos, color_hex }) =>
  supabase && run(supabase.from('global_wall').insert({ handle, message: message.slice(0, 140), x_pos, y_pos, color_hex }));

// ---- reads --------------------------------------------------------------------------------
export const fetchLeaderboard = (dungeon, limit = 10) => !supabase ? Promise.resolve([]) :
  run(supabase.from('leaderboards').select('*').eq('dungeon_name', dungeon).order('clear_time_ms', { ascending: true }).limit(limit));

export const fetchRecentClears = (limit = 5) => !supabase ? Promise.resolve([]) :
  run(supabase.from('leaderboards').select('*').order('timestamp', { ascending: false }).limit(limit));

export const fetchWall = (limit = 100) => !supabase ? Promise.resolve([]) :
  run(supabase.from('global_wall').select('*').order('timestamp', { ascending: false }).limit(limit));

// ---- real-time ----------------------------------------------------------------------------
/** Calls onInsert(row) for every new row in `table`, on every connected device. Returns an unsubscribe function. */
export function subscribe(table, onInsert) {
  if (!supabase) return () => {};
  const channel = supabase.channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, payload => onInsert(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/** Loads rows once, then keeps them live. React hook for any table. */
export function useLiveTable(table, load, { max = 20, match, sort } = {}) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let alive = true;
    load().then(r => alive && setRows(r));
    const off = subscribe(table, row => {
      if (match && !match(row)) return;
      setRows(prev => {
        if (prev.some(p => p.id === row.id)) return prev;
        const next = [row, ...prev];
        return (sort ? next.sort(sort) : next).slice(0, max);
      });
    });
    return () => { alive = false; off(); };
  }, [table]);
  return rows;
}
export const useLeaderboard = dungeon => useLiveTable('leaderboards', () => fetchLeaderboard(dungeon),
  { max: 10, match: r => r.dungeon_name === dungeon, sort: (a, b) => a.clear_time_ms - b.clear_time_ms });
export const useWall = () => useLiveTable('global_wall', () => fetchWall(100), { max: 100 });
