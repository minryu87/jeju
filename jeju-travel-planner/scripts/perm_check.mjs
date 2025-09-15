#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const cwd = process.cwd();
const logDir = path.resolve(cwd, 'logs');
const logPath = path.resolve(logDir, 'etl_validation.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function append(line) {
  const time = new Date().toISOString();
  fs.appendFileSync(logPath, `[${time}] ${line}\n`);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  append('[ERROR] step=PERM_CHECK missing_env url_or_key');
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

async function checkSelect(table) {
  try {
    const { data, error, status } = await supabase.from(table).select('*').limit(1);
    if (error) {
      append(`[ERROR] step=PERM_CHECK table=${table} op=select status=${status} error=${JSON.stringify(error)}`);
    } else {
      append(`[INFO] step=PERM_CHECK table=${table} op=select status=${status} rows=${(data || []).length}`);
    }
  } catch (e) {
    append(`[ERROR] step=PERM_CHECK table=${table} op=select status=0 error=${JSON.stringify({ message: e.message || String(e) })}`);
  }
}

async function checkInsertDeletePlaces() {
  const table = 'places';
  const record = {
    name: 'PERM_CHECK_TEST',
    category_key: 'nature',
    lat: null,
    lng: null,
    image: null,
    description: 'perm_check',
    time: null,
    fee: null,
    url: null
  };

  try {
    const { data, error, status } = await supabase.from(table).insert([record]).select('id');
    if (error) {
      append(`[ERROR] step=PERM_CHECK table=${table} op=insert status=${status} error=${JSON.stringify(error)}`);
      return;
    } else {
      append(`[INFO] step=PERM_CHECK table=${table} op=insert status=${status} rows=${data?.length || 0}`);
    }

    let id = data?.[0]?.id;
    let delRes;
    if (id) {
      delRes = await supabase.from(table).delete().eq('id', id);
    } else {
      delRes = await supabase.from(table).delete().eq('name', 'PERM_CHECK_TEST');
    }

    const { error: derr, status: dstatus } = delRes;
    if (derr) {
      append(`[ERROR] step=PERM_CHECK table=${table} op=delete status=${dstatus} error=${JSON.stringify(derr)}`);
    } else {
      append(`[INFO] step=PERM_CHECK table=${table} op=delete status=${dstatus}`);
    }
  } catch (e) {
    append(`[ERROR] step=PERM_CHECK table=${table} op=insert_delete status=0 error=${JSON.stringify({ message: e.message || String(e) })}`);
  }
}

async function main() {
  append('[INFO] PERM_CHECK start');
  const tables = ['places', 'categories', 'schedules', 'schedule_places'];
  for (const t of tables) {
    await checkSelect(t);
  }
  await checkInsertDeletePlaces();
  append('[INFO] PERM_CHECK done');
}

main().catch((e) => {
  append(`[ERROR] step=PERM_CHECK fatal error=${JSON.stringify({ message: e.message || String(e) })}`);
  process.exit(1);
});