// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ynhxzovgqmctmmffrdkz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaHh6b3ZncW1jdG1tZmZyZGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTYzODUsImV4cCI6MjA1NTkzMjM4NX0.sUgrY2ChUFVSFmh3MTV1uro6yVtGQ9tknSBJZOAxnJ0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);