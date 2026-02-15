import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykgufhzzirlygprddycy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3VmaHp6aXJseWdwcmRkeWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjY0NzgsImV4cCI6MjA4Njc0MjQ3OH0.iWOnYpq6-IniHztPCS6NKrqnk4QcYQL1u9EZFGwyaZI';

export const supabaseExt = createClient(supabaseUrl, supabaseAnonKey);
