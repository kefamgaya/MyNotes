/* config.js */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabaseUrl = 'https://elexbwtfdpczzkqcupph.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZXhid3RmZHBjenprcWN1cHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDQwNjEsImV4cCI6MjA5NTYyMDA2MX0.SCuchlW-3trNwTgHyxORKdYdxMwzIa39L7KBDcRCSqk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
