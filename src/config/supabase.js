const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    "Missing SUPABASE_URL in .env"
  );
}

if (!SUPABASE_KEY) {
  throw new Error(
    "Missing SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
