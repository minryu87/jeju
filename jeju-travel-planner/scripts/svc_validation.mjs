import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svc = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_SECRET;

const logPath = path.resolve('./logs/etl_validation.log');
fs.mkdirSync(path.dirname(logPath), { recursive: true });

function maskKey(k) {
  if (!k) return '';
  const start = k.slice(0, 4);
  const end = k.slice(-6);
  return `${start}...${end}`;
}
function log(level, msg) {
  const ts = new Date().toISOString();
  fs.appendFileSync(logPath, `[${ts}] [${level}] ${msg}\n`);
}
function formatError(e) {
  if (!e) return 'code= msg=';
  const obj = { code: e.code, message: e.message, details: e.details, hint: e.hint, status: e.status };
  return `error=${JSON.stringify(obj)}`;
}

if (!url || !svc) {
  const host = url ? new URL(url).host : '';
  log('ERROR', `[SVC_VALIDATION] Missing env url or service credential url=${host} svc=${maskKey(svc)}`);
  process.exit(1);
}

const supabase = createClient(url, svc, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function countAndSample(table, selectCols = 'id') {
  try {
    const { count, error: errCount } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (errCount) {
      log('ERROR', `[SVC_VALIDATION][${table}.count] ${formatError(errCount)}`);
    } else {
      log('INFO', `[SVC_VALIDATION][${table}.count] ${count}`);
    }
  } catch (e) {
    log('ERROR', `[SVC_VALIDATION][${table}.count] exception=${e?.message || e}`);
  }

  try {
    const { data, error } = await supabase.from(table).select(selectCols).limit(1);
    if (error) {
      log('ERROR', `[SVC_VALIDATION][${table}.sample] ${formatError(error)}`);
    } else {
      log('INFO', `[SVC_VALIDATION][${table}.sample] ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log('ERROR', `[SVC_VALIDATION][${table}.sample] exception=${e?.message || e}`);
  }
}

async function main() {
  const host = new URL(url).host;
  log('INFO', `SVC_VALIDATION Start urlHost=${host} svc=${maskKey(svc)}`);
  await countAndSample('categories', 'id,name');
  await countAndSample('places', 'id,name');
  await countAndSample('schedules', 'id');
  await countAndSample('schedule_places', 'schedule_id,place_id');
  log('INFO', 'SVC_VALIDATION Done');
}

main().catch(err => {
  log('ERROR', `[SVC_VALIDATION] exception=${err?.message || err}`);
  process.exit(1);
});