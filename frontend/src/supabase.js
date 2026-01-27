import { createClient } from "@supabase/supabase-js";

//Database connection to Supabase using environment variables
// Supabase URL and Anon Key for authentication
//Used to connect frontend with Supabase backend to manage user authentication and Chat data storage
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
