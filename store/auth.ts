import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  realm: string | null;
  userToken: string | null;
  isAuthenticated: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
  } | null;
  setCredentials: (realm: string, userToken: string) => void;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      realm: null,
      userToken: null,
      isAuthenticated: false,
      user: null,
      setCredentials: (realm, userToken) => 
        set({ 
          realm, 
          userToken, 
          isAuthenticated: true 
        }),
      setUser: (user) => set({ user }),
      logout: () => 
        set({ 
          realm: null, 
          userToken: null, 
          isAuthenticated: false, 
          user: null 
        }),
    }),
    {
      name: 'quickbase-auth',
      partialize: (state) => ({
        realm: state.realm,
        userToken: state.userToken,
      }),
    }
  )
);