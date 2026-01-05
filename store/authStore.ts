import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { User } from '../types';
import * as authService from '../services/authService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    try {
      const user = await authService.signIn(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    try {
      const result = await authService.signUp(email, password, name);
      if (result.user) {
        set({ user: result.user, isAuthenticated: true, isLoading: false });
        return result.message;
      }
      return result.message;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, isAuthenticated: false });
  },

  resetPassword: async (email: string) => {
    await authService.resetPassword(email);
  },

  checkSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name,
        };
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

// Listen to auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    const user: User = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name,
    };
    useAuthStore.setState({ user, isAuthenticated: true });
  } else {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  }
});

