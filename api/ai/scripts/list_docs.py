"""List all indexed documents and sample chunks for evaluation dataset generation."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import psycopg
from psycopg.rows import dict_row
from src.core.config import settings

def main():
    with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # List all documents
            cur.execute(f"""
                SELECT d.id, d.source_file, d.category, d.is_current, d.source_unit, d.chunk_count
                FROM "{settings.rag_db_schema}".documents d
                ORDER BY d.source_file
            """)
            docs = cur.fetchall()
            print(f"=== TOTAL DOCUMENTS: {len(docs)} ===\n")
            
            categories = {}
            for d in docs:
                cat = d["category"] or "unknown"
                categories[cat] = categories.get(cat, 0) + 1
                sf = d["source_file"] or ""
                cat_str = str(d["category"] or "")
                cur_str = str(d["is_current"] or "")
                unit_str = str(d["source_unit"] or "")
                chunks = d["chunk_count"] or 0
                print(f"{sf:70s} | {cat_str:20s} | {cur_str:6s} | {unit_str:30s} | chunks={chunks}")
            
            print(f"\n=== CATEGORIES ===")
            for cat, count in sorted(categories.items()):
                print(f"  {cat}: {count}")
            
            # Sample chunks with headings from top 10 documents
            print(f"\n=== SAMPLE CHUNKS (first 3 docs) ===")
            for doc in docs[:3]:
                print(f"\n--- {doc['source_file']} ---")
                cur.execute(f"""
                    SELECT heading_path, LEFT(content, 150) as preview
                    FROM "{settings.rag_db_schema}".document_chunks
                    WHERE document_id = %s
                    ORDER BY chunk_index
                    LIMIT 5
                """, (doc["id"],))
                for chunk in cur.fetchall():
                    heading = chunk["heading_path"] or "(no heading)"
                    preview = chunk["preview"].replace("\n", " ")
                    print(f"  [{heading}] {preview}...")

if __name__ == "__main__":
    main()
