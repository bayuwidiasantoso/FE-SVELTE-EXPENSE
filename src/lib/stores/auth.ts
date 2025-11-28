import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

const initial: AuthState = {
  token: null,
  user: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initial);

  function loadFromStorage() {
    if (!browser) return;
    const raw = localStorage.getItem('auth');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AuthState;
      set(parsed);
      console.log('[auth] loaded from localStorage:', parsed);
    } catch (e){
      console.error('[auth] gagal parse localStorage', e);
    }
  }

  if (browser) {
    loadFromStorage();
  }

  function saveToStorage(state: AuthState) {
    if (!browser) return;
    localStorage.setItem('auth', JSON.stringify(state));
  }

  return {
    subscribe,
    login(token: string, user: AuthUser) {
      const state: AuthState = { token, user };
      console.log('[auth] login set state:', state);
      set(state);
      saveToStorage(state);
    },
    logout() {
      const state: AuthState = { token: null, user: null };
      console.log('[auth] logout');
      set(state);
      if (browser) {
        localStorage.removeItem('auth');
      }
    }
  };
}

export const auth = createAuthStore();
