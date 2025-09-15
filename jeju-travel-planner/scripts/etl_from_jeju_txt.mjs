import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = '/workspace/jeju-travel-planner';
const INPUT_PATH = '/workspace/uploads/jeju.txt';
const OUT_SCHEMA = path.join(ROOT, 'supabase', 'schema.sql');
const OUT_SEED_JSON = path.join(ROOT, 'supabase', 'seed', 'from_jeju_txt.json');
const OUT_MAPPING = path.join(ROOT, 'docs', 'data_mapping.md');
const OUT_LOG = path.join(ROOT, 'logs', 'etl_validation.log');

const DDL_SQL = `-- schema.sql 시작
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  key text unique not null,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.places (
  id bigint generated always as identity primary key,
  name text not null,
  category_key text references public.categories(key) on update cascade on delete set null,
  lat double precision,
  lng double precision,
  image text,
  description text,
  time text,
  fee text,
  url text,
  created_at timestamptz default now()
);

create table if not exists public.schedules (
  id bigint generated always as identity primary key,
  key text unique not null,
  date_text text,
  title text,
  weather_text text,
  weather_icon text,
  temp_range text,
  flight_departure text,
  flight_arrival text,
  accommodation_checkin text,
  accommodation_checkout text,
  created_at timestamptz default now()
);

create table if not exists public.schedule_places (
  schedule_id bigint references public.schedules(id) on delete cascade,
  place_id bigint references public.places(id) on delete cascade,
  order_index int not null,
  time_str text,
  created_at timestamptz default now(),
  primary key (schedule_id, place_id, order_index)
);
-- schema.sql 끝
`;

function ensureDirs() {
  for (const p of [
    path.join(ROOT, 'supabase'),
    path.join(ROOT, 'supabase', 'seed'),
    path.join(ROOT, 'docs'),
    path.join(ROOT, 'logs'),
    path.join(ROOT, 'scripts'),
  ]) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(OUT_LOG, line);
  console.log(line.trim());
}

function extractArrays(raw) {
  // Extract top-level bracketed arrays, allowing comments
  const arrays = [];
  let depth = 0;
  let start = -1;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const prev = raw[i - 1];

    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;

    if (inSingle || inDouble) continue;

    if (ch === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0 && start >= 0) {
        arrays.push(raw.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return arrays;
}

function safeEvalArray(code) {
  // Evaluate array literal as JS
  try {
    // Allow comments and single-quoted strings; it's valid JS in Function eval.
    const fn = new Function(`return (${code});`);
    const arr = fn();
    if (!Array.isArray(arr)) throw new Error('Evaluated block is not an array');
    return arr;
  } catch (e) {
    throw new Error(`Failed to evaluate array block: ${e.message}`);
  }
}

function normalizeData(objs) {
  // objs: list of place-like objects with fields: id, name, category, lat, lng, image, description, time, fee, url
  const cats = new Map();
  const catNameMap = {
    nature: '자연/관광지',
    cafe: '카페',
    restaurant: '맛집',
    activity: '액티비티',
  };
  const places = [];

  for (const o of objs) {
    const key = String(o.category || '').trim();
    if (!key) continue;
    if (!cats.has(key)) {
      cats.set(key, { key, name: catNameMap[key] || key });
    }
    places.push({
      source_id: o.id ?? null,
      name: String(o.name || ''),
      category_key: key,
      lat: typeof o.lat === 'number' ? o.lat : Number(o.lat) || null,
      lng: typeof o.lng === 'number' ? o.lng : Number(o.lng) || null,
      image: String(o.image || ''),
      description: String(o.description || ''),
      time: String(o.time || ''),
      fee: String(o.fee || ''),
      url: String(o.url || ''),
    });
  }
  return {
    categories: Array.from(cats.values()),
    places,
    schedules: [],
    schedule_places: [],
  };
}

async function tryDDL(supabase) {
  // With anon key, DDL is generally not permitted. We record this fact and skip execution.
  log('[DDL] Starting DDL execution attempt via Supabase REST (not supported)');

  // There's no direct SQL execution via anon PostgREST.
  // We will write schema.sql to disk and instruct running it in Supabase SQL editor.
  fs.writeFileSync(OUT_SCHEMA, DDL_SQL, 'utf-8');
  log('[DDL] schema.sql written. Note: CREATE TABLE must be executed via Supabase SQL editor or with a service key. Skipping programmatic DDL.');
  return { executed: false, error: 'DDL not executable via anon key. Use Supabase SQL editor to run schema.sql.' };
}

async function upsertCategories(supabase, categories) {
  log(`[UPLOAD] Upserting categories (${categories.length})`);
  const { data, error, status } = await supabase.from('categories').upsert(
    categories.map(c => ({ key: c.key, name: c.name })),
    { onConflict: 'key' }
  ).select();
  if (error) {
    log(`[ERROR][UPLOAD][categories] status=${status} code=${error.code || ''} msg=${error.message}`);
    return { inserted: 0, error };
  }
  log(`[UPLOAD] categories upsert success: ${data?.length ?? 0} rows`);
  return { inserted: data?.length ?? 0 };
}

async function insertPlaces(supabase, places) {
  log(`[UPLOAD] Inserting places (${places.length})`);
  // Optional: avoid duplicates by checking existing names+lat+lng
  const existing = await supabase.from('places').select('id,name,lat,lng');
  if (existing.error) {
    log(`[ERROR][UPLOAD][places.select] code=${existing.error.code || ''} msg=${existing.error.message}`);
  }
  const existingSet = new Set();
  if (existing.data) {
    for (const r of existing.data) {
      existingSet.add(`${(r.name||'').trim()}|${Number(r.lat)||0}|${Number(r.lng)||0}`);
    }
  }
  const toInsert = places.filter(p => {
    const key = `${p.name.trim()}|${Number(p.lat)||0}|${Number(p.lng)||0}`;
    return !existingSet.has(key);
  });

  const batchSize = 500; // small enough
  let total = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const chunk = toInsert.slice(i, i + batchSize).map(p => ({
      name: p.name,
      category_key: p.category_key,
      lat: p.lat,
      lng: p.lng,
      image: p.image,
      description: p.description,
      time: p.time,
      fee: p.fee,
      url: p.url,
    }));
    const { data, error, status } = await supabase.from('places').insert(chunk).select();
    if (error) {
      log(`[ERROR][UPLOAD][places.insert] idx=${i} status=${status} code=${error.code || ''} msg=${error.message}`);
      return { inserted: total, error };
    }
    total += data?.length || 0;
    log(`[UPLOAD] places insert chunk i=${i} count=${data?.length || 0}`);
  }
  log(`[UPLOAD] places insert success total=${total}`);
  return { inserted: total };
}

async function validate(supabase) {
  log('[VALIDATION] Start');
  async function countAndSample(table) {
    const countRes = await supabase.from(table).select('*', { count: 'exact', head: true });
    const cnt = (countRes.count ?? 0);
    if (countRes.error) {
      log(`[ERROR][VALIDATION][${table}.count] code=${countRes.error.code || ''} msg=${countRes.error.message}`);
    } else {
      log(`[VALIDATION] ${table} count = ${cnt}`);
    }
    const sampleRes = await supabase.from(table).select('*').order('id', { ascending: true }).limit(3);
    if (sampleRes.error) {
      log(`[ERROR][VALIDATION][${table}.sample] code=${sampleRes.error.code || ''} msg=${sampleRes.error.message}`);
    } else {
      log(`[VALIDATION] ${table} sample (up to 3): ${JSON.stringify(sampleRes.data)}`);
    }
  }
  await countAndSample('categories');
  await countAndSample('places');
  await countAndSample('schedules'); // expected possibly 0
  await countAndSample('schedule_places'); // expected possibly 0
  log('[VALIDATION] Done');
}

async function main() {
  ensureDirs();
  fs.writeFileSync(OUT_LOG, ''); // reset log

  log('[INFO] ETL start');
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');

  const blocks = extractArrays(raw);
  log(`[INFO] Detected array blocks: ${blocks.length}`);

  let allObjs = [];
  for (let i = 0; i < blocks.length; i++) {
    try {
      const arr = safeEvalArray(blocks[i]);
      log(`[INFO] Block ${i + 1} parsed: ${arr.length} items`);
      allObjs = allObjs.concat(arr);
    } catch (e) {
      log(`[ERROR][PARSE] Block ${i + 1} parse failed: ${e.message}`);
    }
  }

  const normalized = normalizeData(allObjs);
  fs.writeFileSync(OUT_SEED_JSON, JSON.stringify(normalized, null, 2), 'utf-8');
  log(`[INFO] Seed JSON written: ${OUT_SEED_JSON} (categories=${normalized.categories.length}, places=${normalized.places.length}, schedules=0, schedule_places=0)`);

  // Write schema.sql now
  fs.writeFileSync(OUT_SCHEMA, DDL_SQL, 'utf-8');
  log(`[INFO] schema.sql written: ${OUT_SCHEMA}`);

  // Mapping doc
  const mappingMd = `# Data Mapping (jeju.txt -> Supabase)

Source file: ${INPUT_PATH}

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
  - counts and first 3 samples per table recorded in logs: ${OUT_LOG}
`;
  fs.writeFileSync(OUT_MAPPING, mappingMd, 'utf-8');
  log(`[INFO] Mapping doc written: ${OUT_MAPPING}`);

  // Supabase connection
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    log('[WARN] Supabase env missing. Skipping upload and validation. You can connect MGX Supabase tab and rerun this script.');
    log('[INFO] ETL finished with warnings (no upload performed).');
    return;
  }

  const supabase = createClient(url, anon);

  // Attempt DDL (document-only)
  await tryDDL(supabase);

  // Upload categories and places
  const catRes = await upsertCategories(supabase, normalized.categories);
  if (catRes.error) {
    log('[WARN] Skipping places upload due to categories error.');
  } else {
    const placesRes = await insertPlaces(supabase, normalized.places);
    if (placesRes.error) {
      log('[ERROR] Places upload encountered an error. See above.');
    }
  }

  // Validation
  await validate(supabase);

  log('[INFO] ETL completed.');
}

main().catch(err => {
  log(`[FATAL] ${err?.stack || err?.message || String(err)}`);
  process.exit(1);
});