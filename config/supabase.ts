import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://llhbfnbitprqaxnorsjh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaGJmbmJpdHBycWF4bm9yc2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzYzOTMsImV4cCI6MjA4MzIxMjM5M30.0M8iu4WcQ3z-Dvom9AH9GoPiKKUcyyD9itT-sCXuW3Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export const STORAGE_BUCKET = 'files';


