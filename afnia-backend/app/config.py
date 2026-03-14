from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "afnia_data"

JOBS_DIR = DATA_DIR / "jobs"
DATASETS_DIR = DATA_DIR / "datasets"
CONTRIBUTORS_DIR = DATA_DIR / "contributors"

DATA_DIR.mkdir(parents=True, exist_ok=True)
JOBS_DIR.mkdir(parents=True, exist_ok=True)
DATASETS_DIR.mkdir(parents=True, exist_ok=True)
CONTRIBUTORS_DIR.mkdir(parents=True, exist_ok=True)


