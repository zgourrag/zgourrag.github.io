// Player state. Zero-auth: the 1337 handle lives in localStorage (via persist) and is the only identity.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAX_HP } from './combat';

// Keep in sync with data/world.json "spawn". z is the map id ("world", "libft", ...): the third coordinate.
const START = { z: 'world', x: 2, y: 5 };

export const useCadet = create(
  persist(
    (set, get) => ({
      handle: null, campus: '1337 Khouribga', avatar: 'cadet_01',
      loc: { ...START }, facing: 'down',
      hp: MAX_HP, xp: 0,
      inventory: { badges: [], items: {} },
      coffeeReadyAt: 0,
      runStartedAt: null,                      // dungeon timer (session only)

      setIdentity: (handle, campus) => set({ handle, campus }),
      setCampus: campus => set({ campus }),
      moveTo: (x, y, facing) => set(s => ({ loc: { ...s.loc, x, y }, facing })),
      teleport: (z, x, y) => set(s => ({
        loc: { z, x, y },
        runStartedAt: z === 'world' ? null : (s.loc.z === 'world' ? Date.now() : s.runStartedAt)
      })),
      setHp: hp => set({ hp: Math.max(0, Math.min(MAX_HP, hp)) }),
      gainXp: n => set(s => ({ xp: s.xp + n })),
      addBadge: id => set(s => s.inventory.badges.includes(id) ? s
        : { inventory: { ...s.inventory, badges: [...s.inventory.badges, id] } }),
      hasBadge: id => get().inventory.badges.includes(id),
      tryCoffee: () => {                        // coffee machines heal, with a 30s cooldown
        const now = Date.now();
        if (now < get().coffeeReadyAt) return false;
        set({ hp: MAX_HP, coffeeReadyAt: now + 30000 });
        return true;
      },
      respawn: () => set({ hp: MAX_HP, loc: { ...START }, facing: 'down', runStartedAt: null })
    }),
    {
      name: 'cadet-save',
      partialize: s => ({ handle: s.handle, campus: s.campus, avatar: s.avatar, loc: s.loc, facing: s.facing,
                          hp: s.hp, xp: s.xp, inventory: s.inventory, coffeeReadyAt: s.coffeeReadyAt })
    }
  )
);
