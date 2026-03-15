"""
TimeMachine — SQLite tabanlı kalıcı durum katmanı.

Elektrik kesintisi veya restart sonrasında sınav state'ini,
öğrenci bilgilerini ve her öğrencinin her soruda yazdığı son
kodu kurtarmak için kullanılır.

Tablolar:
  exam_session   — sınav durum bilgisi (tek satır, id=1)
  students       — bağlanan öğrenciler (ip PRIMARY KEY)
  code_snapshots — her öğrenci/soru için son kod (INSERT OR REPLACE)
"""

import sqlite3
import os
import threading
from datetime import datetime, timezone

DB_PATH = os.path.join("grader", "timemachine.db")

_lock = threading.Lock()


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # concurrent read + write
    conn.execute("PRAGMA synchronous=NORMAL")  # hız / güvenlik dengesi
    return conn


def init_db():
    """Uygulama başlangıcında tabloları oluşturur (varsa dokunmaz)."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with _lock:
        conn = _get_conn()
        with conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS exam_session (
                    id                    INTEGER PRIMARY KEY DEFAULT 1,
                    exam_id               TEXT    NOT NULL DEFAULT 'exam_001',
                    state                 TEXT    NOT NULL DEFAULT 'idle',
                    language              TEXT,
                    exam_data_json        TEXT,
                    started_at            TEXT,
                    paused_at             TEXT,
                    total_paused_secs     REAL    NOT NULL DEFAULT 0.0,
                    updated_at            TEXT    NOT NULL DEFAULT ''
                );

                INSERT OR IGNORE INTO exam_session (id, updated_at)
                VALUES (1, '');

                CREATE TABLE IF NOT EXISTS students (
                    ip            TEXT    PRIMARY KEY,
                    student_no    TEXT    NOT NULL,
                    ad            TEXT    NOT NULL DEFAULT '',
                    soyad         TEXT    NOT NULL DEFAULT '',
                    bolum         TEXT,
                    sinif         TEXT,
                    current_q     INTEGER DEFAULT 1,
                    last_seen     TEXT,
                    joined_at     TEXT
                );

                CREATE TABLE IF NOT EXISTS code_snapshots (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_no    TEXT    NOT NULL,
                    question_id   TEXT    NOT NULL,
                    code          TEXT    NOT NULL,
                    lang          TEXT,
                    saved_at      TEXT    NOT NULL,
                    trigger       TEXT    DEFAULT 'autosave'
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshot_uniq
                    ON code_snapshots (student_no, question_id);
            """)
        conn.close()


# ── exam_session ──────────────────────────────────────────────────────────────

def save_exam_session(
    exam_id: str,
    state: str,
    language: str | None,
    exam_data_json: str | None,
    started_at,        # datetime | None
    paused_at,         # datetime | None
    total_paused_secs: float,
):
    """pool_manager'ın exam state'ini DB'ye yazar."""
    now_str = datetime.now(timezone.utc).isoformat()

    def fmt(dt):
        return dt.isoformat() if dt else None

    with _lock:
        conn = _get_conn()
        with conn:
            conn.execute("""
                INSERT INTO exam_session
                    (id, exam_id, state, language, exam_data_json,
                     started_at, paused_at, total_paused_secs, updated_at)
                VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    exam_id           = excluded.exam_id,
                    state             = excluded.state,
                    language          = excluded.language,
                    exam_data_json    = excluded.exam_data_json,
                    started_at        = excluded.started_at,
                    paused_at         = excluded.paused_at,
                    total_paused_secs = excluded.total_paused_secs,
                    updated_at        = excluded.updated_at
            """, (
                exam_id, state, language, exam_data_json,
                fmt(started_at), fmt(paused_at), total_paused_secs, now_str
            ))
        conn.close()


def load_exam_session() -> dict | None:
    """
    DB'deki exam_session satırını dict olarak döner.
    state='idle' ve started_at=None ise None döner (taze başlangıç).
    """
    with _lock:
        conn = _get_conn()
        row = conn.execute(
            "SELECT * FROM exam_session WHERE id = 1"
        ).fetchone()
        conn.close()

    if row is None:
        return None
    d = dict(row)
    # state idle + başlamamış → kurtarılacak bir şey yok
    if d["state"] == "idle" and not d["started_at"]:
        return None
    return d


# ── students ──────────────────────────────────────────────────────────────────

def save_student(ip: str, student_no: str, ad: str, soyad: str,
                 bolum: str | None, sinif: str | None,
                 current_q: int = 1, last_seen: str | None = None):
    """Öğrenciyi DB'ye ekler veya günceller."""
    joined = datetime.now(timezone.utc).isoformat()
    with _lock:
        conn = _get_conn()
        with conn:
            conn.execute("""
                INSERT INTO students
                    (ip, student_no, ad, soyad, bolum, sinif,
                     current_q, last_seen, joined_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(ip) DO UPDATE SET
                    student_no = excluded.student_no,
                    ad         = excluded.ad,
                    soyad      = excluded.soyad,
                    bolum      = excluded.bolum,
                    sinif      = excluded.sinif,
                    current_q  = excluded.current_q,
                    last_seen  = excluded.last_seen
            """, (ip, student_no, ad, soyad, bolum, sinif,
                  current_q, last_seen, joined))
        conn.close()


def update_student_question(ip: str, question_no: int, last_seen: str):
    """Öğrencinin bulunduğu soruyu ve son görülme zamanını günceller."""
    with _lock:
        conn = _get_conn()
        with conn:
            conn.execute("""
                UPDATE students
                SET current_q = ?, last_seen = ?
                WHERE ip = ?
            """, (question_no, last_seen, ip))
        conn.close()


def update_student_last_seen(ip: str, last_seen: str, new_ip: str | None = None):
    """Öğrencinin son görülme zamanını (ve opsiyonel IP'yi) günceller."""
    with _lock:
        conn = _get_conn()
        with conn:
            if new_ip:
                conn.execute("""
                    UPDATE students SET last_seen = ?, ip = ? WHERE ip = ?
                """, (last_seen, new_ip, ip))
            else:
                conn.execute("""
                    UPDATE students SET last_seen = ? WHERE ip = ?
                """, (last_seen, ip))
        conn.close()


def load_all_students() -> list[dict]:
    """DB'deki tüm öğrencileri döner."""
    with _lock:
        conn = _get_conn()
        rows = conn.execute("SELECT * FROM students").fetchall()
        conn.close()
    return [dict(r) for r in rows]


# ── code_snapshots ────────────────────────────────────────────────────────────

def save_code_snapshot(student_no: str, question_id: str,
                       code: str, lang: str | None,
                       trigger: str = "autosave"):
    """
    Öğrencinin bir soruda yazdığı son kodu DB'ye kaydeder.
    UNIQUE(student_no, question_id) → INSERT OR REPLACE ile daima tek satır.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    with _lock:
        conn = _get_conn()
        with conn:
            conn.execute("""
                INSERT INTO code_snapshots
                    (student_no, question_id, code, lang, saved_at, trigger)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(student_no, question_id) DO UPDATE SET
                    code     = excluded.code,
                    lang     = excluded.lang,
                    saved_at = excluded.saved_at,
                    trigger  = excluded.trigger
            """, (student_no, question_id, code, lang, now_str, trigger))
        conn.close()


def load_student_codes(student_no: str) -> dict:
    """
    Bir öğrencinin tüm sorulardaki son kodlarını döner.
    Dönüş: { "q1": {"code": "...", "lang": "python", "saved_at": "..."}, ... }
    """
    with _lock:
        conn = _get_conn()
        rows = conn.execute("""
            SELECT question_id, code, lang, saved_at
            FROM code_snapshots
            WHERE student_no = ?
        """, (student_no,)).fetchall()
        conn.close()

    return {
        row["question_id"]: {
            "code":     row["code"],
            "lang":     row["lang"],
            "saved_at": row["saved_at"],
        }
        for row in rows
    }


def load_all_snapshots() -> list[dict]:
    """Tüm snapshot'ları döner (admin export / debug için)."""
    with _lock:
        conn = _get_conn()
        rows = conn.execute("SELECT * FROM code_snapshots").fetchall()
        conn.close()
    return [dict(r) for r in rows]
