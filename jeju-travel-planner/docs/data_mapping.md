# Data Mapping (jeju.txt -> Supabase)

Source file: /workspace/uploads/jeju.txt

Parsed sections:
- Arrays of place objects grouped under headings (자연/관광지, 카페, 맛집, 액티비티).
- Each object fields:
  - id (source only), name, category, lat, lng, image, description, time, fee, url

Normalized targets:
- public.categories
  - key: unique text derived from "category" (nature|cafe|restaurant|activity)
  - name: human-readable label (자연/관광지, 카페, 맛집, 액티비티)
- public.places
  - name -> name
  - category_key -> from "category"
  - lat -> lat (double), lng -> lng (double)
  - image, description, time, fee, url -> as-is
  - (source_id is stored only in seed JSON for traceability; not inserted)
- public.schedules: Not present in source (none created)
- public.schedule_places: Not present in source (none created)

Notes:
- DDL (schema.sql) is provided. Creating tables via programmatic anon key is not permitted; please execute schema.sql in Supabase SQL editor if tables do not exist.
- Upserts:
  - categories: upsert on key
  - places: insert new rows; duplicates avoided by (name,lat,lng) check before insert
- Validation:
  - counts and first 3 samples per table recorded in logs: /workspace/jeju-travel-planner/logs/etl_validation.log
