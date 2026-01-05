import { supabase } from '../config/supabase';
import { User } from '../types';

export interface SignUpResult {
  user: User | null;
  message: string | null;
}

export const signIn = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('Sign in failed');

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.name,
  };
};

export const signUp = async (
  email: string,
  password: string,
  name?: string
): Promise<SignUpResult> => {
  // Sign up with email confirmation disabled - users can login immediately
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: undefined, // No email redirect needed
    },
  });

  if (error) throw error;

  // If user is created and session exists, login immediately
  if (data.user && data.session) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name || data.user.user_metadata?.name,
      },
      message: null,
    };
  }

  // Even if session doesn't exist, try to sign in immediately
  // (This works when email confirmation is disabled in Supabase dashboard)
  if (data.user) {
    try {
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInResult.data.user && signInResult.data.session) {
        return {
          user: {
            id: signInResult.data.user.id,
            email: signInResult.data.user.email,
            name: name || signInResult.data.user.user_metadata?.name,
          },
          message: null,
        };
      }
    } catch (signInError) {
      // If sign in fails, user was created but needs to login manually
      return {
        user: null,
        message: 'Account created successfully! Please sign in.',
      };
    }
  }

  return {
    user: null,
    message: 'Account created successfully! Please sign in.',
  };
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'drive-clone://reset-password',
  });
  if (error) throw error;
};

