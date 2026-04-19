import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[DB] Supabase client initialized")
    except Exception as e:
        print(f"[DB] Failed to initialize Supabase: {e}")
else:
    print("[DB] Warning: Supabase credentials missing in .env")

def get_db():
    return supabase
