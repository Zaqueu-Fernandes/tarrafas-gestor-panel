import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykgufhzzirlygprddycy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3VmaHp6aXJseWdwcmRkeWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTIxOTMsImV4cCI6MjA1MjUyODE5M30.mI8mXP1X7MKaIhYwlXsQ4LKYN5-MqTZfCCNbFfOUvQc';

export const supabaseExt = createClient(supabaseUrl, supabaseAnonKey);
