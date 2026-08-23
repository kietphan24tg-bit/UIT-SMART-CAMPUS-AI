"""Analyze documents for eval dataset generation."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import psycopg
from psycopg.rows import dict_row
from src.core.config import settings

def main():
    with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Top documents with most chunks
            cur.execute(f"""
                SELECT d.id, d.source_file, d.category, d.chunk_count
                FROM "{settings.rag_db_schema}".documents d
                WHERE d.category != 'unknown' AND d.chunk_count > 5
                ORDER BY d.chunk_count DESC
                LIMIT 20
            """)
            docs = cur.fetchall()
            print("=== TOP DOCS WITH CONTENT ===")
            for d in docs:
                print(f"  {d['chunk_count']:4d} chunks | {d['category']:25s} | {d['source_file']}")

            # Sample headings from key categories
            for cat in ["training_regulation", "exam", "student_affairs", "learning_outcome"]:
                print(f"\n=== HEADINGS: {cat} ===")
                cur.execute(f"""
                    SELECT DISTINCT c.heading_path, d.source_file
                    FROM "{settings.rag_db_schema}".document_chunks c
                    JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                    WHERE d.category = %s
                    AND c.heading_path IS NOT NULL
                    AND LENGTH(c.heading_path) > 10
                    ORDER BY d.source_file, c.heading_path
                    LIMIT 20
                """, (cat,))
                for r in cur.fetchall():
                    hp = r["heading_path"][:80]
                    print(f"  {r['source_file']:55s} | {hp}")

            # Sample actual chunk content from a training regulation doc
            print("\n=== SAMPLE CONTENT: daa-790 (quy che dao tao) ===")
            cur.execute(f"""
                SELECT c.heading_path, LEFT(c.content, 300) as preview
                FROM "{settings.rag_db_schema}".document_chunks c
                JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                WHERE d.source_file LIKE 'daa-790%%'
                ORDER BY c.chunk_index
                LIMIT 10
            """)
            for r in cur.fetchall():
                heading = (r["heading_path"] or "(no heading)")[:60]
                preview = r["preview"].replace("\n", " ")[:200]
                print(f"\n  [{heading}]\n  {preview}...")

            cur.execute(f'SELECT count(*) as cnt FROM "{settings.rag_db_schema}".document_chunks')
            print(f"\nTotal chunks: {cur.fetchone()['cnt']}")

if __name__ == "__main__":
    main()
