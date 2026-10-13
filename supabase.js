
import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ntwayeltgeqdjbcjnchc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YlLf32QTY7LnU7k9_2J_Wg_yMc3OBCv";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
