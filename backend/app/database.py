import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

# --- Resolve DATABASE_URL with robust fallback ---
raw_url = os.getenv("DATABASE_URL", "").strip()

if not raw_url:
    # No env var set — use local SQLite
    DATABASE_URL = "sqlite:///./inventory.db"
    print("[DB] No DATABASE_URL found — using SQLite fallback", flush=True)
else:
    # Render provides postgres:// but SQLAlchemy 2.x requires postgresql://
    if raw_url.startswith("postgres://"):
        DATABASE_URL = raw_url.replace("postgres://", "postgresql://", 1)
        print(f"[DB] Converted postgres:// → postgresql:// scheme", flush=True)
    else:
        DATABASE_URL = raw_url

    # Mask password for safe logging
    try:
        from urllib.parse import urlparse
        parsed = urlparse(DATABASE_URL)
        safe_url = f"{parsed.scheme}://{parsed.hostname}:{parsed.port}{parsed.path}"
        print(f"[DB] Connecting to: {safe_url}", flush=True)
    except Exception:
        print("[DB] Connecting to PostgreSQL (URL parse for logging failed)", flush=True)

# --- Engine setup ---
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,   # auto-reconnect on stale connections
    )
    print("[DB] SQLAlchemy engine created successfully", flush=True)
except Exception as e:
    print(f"[DB] FATAL: Could not create engine — {e}", flush=True)
    print(f"[DB] DATABASE_URL scheme received: '{DATABASE_URL[:30]}...'", flush=True)
    sys.exit(1)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
