import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

const mask = (v?: string) => {
  if (!v) return 'undefined';
  try {
    if (v.length <= 12) return '****';
    const head = v.slice(0, 4);
    const tail = v.slice(-4);
    return `${head}...${tail}`;
  } catch {
    return '****';
  }
};

function base64UrlDecode(input: string): string {
  try {
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    return Buffer.from(b64 + pad, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function detectServiceRole(key?: string): boolean {
  if (!key) return false;
  // Quick heuristic: try to decode the payload and check role claim
  // JWT format: header.payload.signature
  const parts = key.split('.');
  if (parts.length >= 2) {
    const payloadStr = base64UrlDecode(parts[1]);
    if (/service_role/i.test(payloadStr) || /"role"\s*:\s*"service_role"/i.test(payloadStr)) {
      return true;
    }
  }
  // Fallback literal check (rarely present in encoded form, but harmless)
  if (/service_role/.test(key)) return true;
  return false;
}

const isServiceRoleInClientEnv = detectServiceRole(anon);

// Security guard: block creating client if service role is detected in client env
export const clientBlockedReason = isServiceRoleInClientEnv
  ? 'service_role_in_client_env'
  : null;

function logEnvInit() {
  const masked = { urlHost: 'unknown', anonMasked: mask(anon) };
  try {
    masked.urlHost = url ? new URL(url).host : 'undefined';
  } catch {
    masked.urlHost = url || 'undefined';
  }
  if (!url || !anon) {
    console.warn('Supabase env missing: using local fallback data', masked);
  } else if (isServiceRoleInClientEnv) {
    console.error('Service role key detected in client env; blocked', masked);
  } else {
    console.log('[Supabase] init', masked);
  }
}
logEnvInit();

export const supabase = (!url || !anon || isServiceRoleInClientEnv)
  ? (null as any)
  : createClient(url, anon, {
      auth: { persistSession: false },
    });

export type SupabaseErr = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
};

// Centralized error logger with rich payload to help Network tab correlation
export function logSupabaseError(ctx: { table: string; op: string; status?: number; error?: SupabaseErr | any; responseBodySnippet?: any }) {
  const { table, op, status, error, responseBodySnippet } = ctx;
  const payload = {
    table,
    op,
    status: status ?? (error?.status || undefined),
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    responseBodySnippet,
    raw: error, // keep raw for deep debug in console
  };
  console.error('[Supabase]', payload);
}