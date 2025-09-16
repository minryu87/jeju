'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase as supabaseClient, logSupabaseError, SupabaseErr, clientBlockedReason } from '../lib/supabaseClient';

type Category = { key: string; name?: string };
type Place = {
  id?: number;
  name: string;
  category_key?: string | null;
  lat?: number | null;
  lng?: number | null;
  image?: string | null;
  description?: string | null;
  time?: string | null;
  fee?: string | null;
  url?: string | null;
  created_at?: string;
};

const bannerStyle: React.CSSProperties = {
  padding: '10px 12px',
  margin: '8px 0',
  borderRadius: 6,
  fontSize: 14,
  lineHeight: 1.4,
};

const warnStyle: React.CSSProperties = {
  ...bannerStyle,
  background: '#fff3cd',
  color: '#664d03',
  border: '1px solid #ffecb5',
};

const errorStyle: React.CSSProperties = {
  ...bannerStyle,
  background: '#f8d7da',
  color: '#842029',
  border: '1px solid #f5c2c7',
};

const okStyle: React.CSSProperties = {
  ...bannerStyle,
  background: '#d1e7dd',
  color: '#0f5132',
  border: '1px solid #badbcc',
};

function mask(v?: string) {
  if (!v) return 'undefined';
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}

function isRlsError(status?: number, err?: SupabaseErr) {
  const code = err?.code || '';
  const msg = (err?.message || '') + ' ' + (err?.details || '');
  return status === 401 || status === 403 || /42501/i.test(code) || /RLS|row-level security/i.test(msg);
}

function rlsBanner(status?: number, err?: SupabaseErr) {
  if (!isRlsError(status, err)) return null;
  return '권한 정책(RLS)으로 인해 접근이 거부되었습니다. 관리자에게 문의하시거나 Supabase RLS 정책(SELECT/INSERT/UPDATE 등)을 확인해 주세요.';
}

export default function JejuTravelPlanner() {
  const supabase = supabaseClient;
  const [categories, setCategories] = useState<Category[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [banner, setBanner] = useState<{ type: 'ok' | 'warn' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Simple inputs for add place
  const [newName, setNewName] = useState<string>('');
  const [newCategoryKey, setNewCategoryKey] = useState<string>('');

  // Health check on mount + initial load
  useEffect(() => {
    let isMounted = true;

    async function healthAndLoad() {
      try {
        // Security: block network when service_role key was detected in client env
        if (clientBlockedReason) {
          console.error('[Security] Service role key detected in client env; all client-side Supabase calls are blocked.', {
            reason: clientBlockedReason,
            url: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
            anon: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          });
          if (isMounted) {
            setBanner({
              type: 'error',
              text:
                '보안 경고: 브라우저 환경변수에서 service_role 키가 감지되어 호출이 차단되었습니다. 서비스 키는 ETL 전용이며, 프론트에 노출하면 안 됩니다.',
            });
            setCategories([]);
            setPlaces([]);
            setLoading(false);
          }
          return;
        }

        if (!supabase) {
          console.warn('[Supabase] client is null. Env missing or invalid. Falling back to in-memory data.', {
            url: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
            anon: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          });
          if (isMounted) {
            setBanner({
              type: 'warn',
              text:
                'Supabase 환경변수가 없거나 잘못되었습니다. 임시로 메모리 데이터로 동작하며 저장되지 않습니다.',
            });
            setCategories([]);
            setPlaces([]);
            setLoading(false);
          }
          return;
        }

        // Healthcheck
        try {
          const { data: hcData, error: hcError, status: hcStatus } = await supabase
            .from('categories')
            .select('key')
            .limit(1);

          if (hcError) {
            logSupabaseError({ table: 'categories', op: 'select(health)', status: hcStatus, error: hcError as any });
            const msg = rlsBanner(hcStatus, hcError as any)
              || `Supabase 연결/권한 확인 필요 (status=${hcStatus}, error=${(hcError as any)?.message || ''}${
                (hcError as any)?.details ? `, details=${(hcError as any)?.details}` : ''
              }).`;
            if (isMounted) setBanner({ type: 'warn', text: msg });
          } else {
            console.log('[Supabase][Health] OK', { rows: (hcData || []).length });
          }
        } catch (e: any) {
          console.error('[Supabase][Health] unexpected', e?.message || e);
          if (isMounted)
            setBanner({
              type: 'warn',
              text: 'Supabase 헬스체크 중 예기치 않은 오류가 발생했습니다. 콘솔 로그를 확인하세요.',
            });
        }

        // Load categories
        try {
          const { data: catData, error: catError, status: catStatus } = await supabase
            .from('categories')
            .select('key,name')
            .order('key', { ascending: true });

          if (catError) {
            logSupabaseError({ table: 'categories', op: 'select', status: catStatus, error: catError as any });
            const msg = rlsBanner(catStatus, catError as any)
              || `카테고리 로드 실패(status=${catStatus}): ${(catError as any)?.message || ''}${
                (catError as any)?.details ? `, details=${(catError as any)?.details}` : ''
              }`;
            if (isMounted) {
              setBanner({ type: 'warn', text: msg });
              setCategories([]);
            }
          } else {
            if (isMounted) setCategories(catData || []);
          }
        } catch (e: any) {
          console.error('[Supabase][categories.select][unexpected]', e?.message || e);
          if (isMounted) setBanner({ type: 'warn', text: '카테고리 로드 중 예기치 않은 오류가 발생했습니다.' });
        }

        // Load places
        try {
          const { data: plcData, error: plcError, status: plcStatus } = await supabase
            .from('places')
            .select('id,name,category_key,lat,lng,image,description,time,fee,url,created_at')
            .order('id', { ascending: true });

          if (plcError) {
            logSupabaseError({ table: 'places', op: 'select', status: plcStatus, error: plcError as any });
            const msg = rlsBanner(plcStatus, plcError as any)
              || `장소 로드 실패(status=${plcStatus}): ${(plcError as any)?.message || ''}${
                (plcError as any)?.details ? `, details=${(plcError as any)?.details}` : ''
              }`;
            if (isMounted) {
              setBanner({ type: 'warn', text: msg });
              setPlaces([]);
            }
          } else {
            if (isMounted) setPlaces(plcData || []);
            if (isMounted) setBanner({ type: 'ok', text: 'Supabase에서 데이터가 정상적으로 로드되었습니다.' });
          }
        } catch (e: any) {
          console.error('[Supabase][places.select][unexpected]', e?.message || e);
          if (isMounted) setBanner({ type: 'warn', text: '장소 로드 중 예기치 않은 오류가 발생했습니다.' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    healthAndLoad();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const filteredPlaces = useMemo(() => {
    if (selectedCategory === 'all') return places;
    return places.filter((p) => (p.category_key || '') === selectedCategory);
  }, [places, selectedCategory]);

  async function handleAddPlace(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const category_key = newCategoryKey.trim() || null;

    if (!name) {
      setBanner({ type: 'warn', text: '이름을 입력해 주세요.' });
      return;
    }

    const newItem: Place = {
      name,
      category_key,
      description: 'user-added',
    };

    // Security guard
    if (clientBlockedReason) {
      setPlaces((prev) => [
        ...prev,
        { ...newItem, id: Date.now(), created_at: new Date().toISOString() },
      ]);
      setBanner({
        type: 'error',
        text:
          '보안 경고: service_role 키 감지로 네트워크 호출이 차단되어, 메모리에만 추가되었습니다. 서비스 키는 브라우저에 노출하면 안 됩니다.',
      });
      setNewName('');
      setNewCategoryKey('');
      return;
    }

    if (!supabase) {
      console.warn('[Supabase] client is null, adding to local state only.');
      setPlaces((prev) => [
        ...prev,
        { ...newItem, id: Date.now(), created_at: new Date().toISOString() },
      ]);
      setBanner({
        type: 'warn',
        text: 'Supabase 비활성 상태. 로컬 메모리에만 추가되었습니다(새로고침 시 사라짐).',
      });
      setNewName('');
      setNewCategoryKey('');
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from('places')
        .insert([newItem])
        .select('id,name,category_key,lat,lng,image,description,time,fee,url,created_at');

      if (error) {
        const err = error as SupabaseErr;
        logSupabaseError({ table: 'places', op: 'insert', status, error: err });

        let msg = `장소 추가 실패(status=${status}): ${err.message || ''}`;
        if (err.details) msg += `, details=${err.details}`;
        if (isRlsError(status, err)) {
          msg = '권한 정책(RLS)으로 인해 접근이 거부되었습니다. 관리자에게 문의해 주세요.';
        } else if ((err.code && /23503/.test(err.code)) || /foreign key/i.test(err.message || '')) {
          msg = '카테고리 키를 먼저 생성/선택하세요. (외래키 제약 조건 위반)';
        } else if (status === 409) {
          msg = '충돌이 발생했습니다(중복 등). 입력값을 확인해 주세요.';
        }

        // Fall back to local
        setPlaces((prev) => [
          ...prev,
          { ...newItem, id: Date.now(), created_at: new Date().toISOString() },
        ]);
        setBanner({ type: 'warn', text: `${msg} — 대신 메모리에만 추가되었습니다.` });
      } else {
        const inserted = (data && data[0]) ? data[0] : null;
        if (inserted) {
          setPlaces((prev) => [...prev, inserted]);
        }
        setBanner({ type: 'ok', text: '장소가 Supabase에 성공적으로 추가되었습니다.' });
      }
    } catch (e: any) {
      console.error('[Supabase][insert][unexpected]', e?.message || e);
      setPlaces((prev) => [
        ...prev,
        { ...newItem, id: Date.now(), created_at: new Date().toISOString() },
      ]);
      setBanner({
        type: 'warn',
        text: '예기치 않은 오류로 인해 메모리에만 추가되었습니다. 콘솔 로그를 확인하세요.',
      });
    } finally {
      setNewName('');
      setNewCategoryKey('');
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Jeju Travel Planner</h1>

      {/* Connection & security banner */}
      <div style={{ marginBottom: 8 }}>
        {banner && (
          <div style={banner.type === 'ok' ? okStyle : banner.type === 'warn' ? warnStyle : errorStyle}>
            {banner.text}
          </div>
        )}
        {!supabase && !clientBlockedReason && (
          <div style={warnStyle}>
            Supabase URL/Anon이 설정되지 않았습니다. 현재 상태: url={mask(process.env.NEXT_PUBLIC_SUPABASE_URL)}, anon={mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)}
          </div>
        )}
        {clientBlockedReason && (
          <div style={errorStyle}>
            보안 경고: service_role 키가 클라이언트 환경에서 감지되어 네트워크 호출이 중단되었습니다. 서비스 키는 오직 서버/ETL에서만 사용하세요.
          </div>
        )}
      </div>

      {/* Health info */}
      <div style={{ marginBottom: 12, fontSize: 13, color: '#555' }}>
        {loading ? '로딩 중...' : `카테고리 ${categories.length}개, 장소 ${places.length}개`}
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 10px',
            borderRadius: 16,
            border: '1px solid #ccc',
            background: selectedCategory === 'all' ? '#e7f1ff' : '#fff',
            cursor: 'pointer',
          }}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setSelectedCategory(c.key)}
            style={{
              padding: '6px 10px',
              borderRadius: 16,
              border: '1px solid #ccc',
              background: selectedCategory === c.key ? '#e7f1ff' : '#fff',
              cursor: 'pointer',
            }}
            title={c.name || c.key}
          >
            {c.name || c.key}
          </button>
        ))}
      </div>

      {/* Add place form */}
      <form onSubmit={handleAddPlace} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 장소 이름"
          style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }}
        />
        <input
          value={newCategoryKey}
          onChange={(e) => setNewCategoryKey(e.target.value)}
          placeholder="카테고리 키(예: nature)"
          style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6 }}
        />
        <button type="submit" style={{ padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
          장소 추가
        </button>
      </form>

      {/* Places list */}
      <div>
        {filteredPlaces.length === 0 ? (
          <div style={{ color: '#666', fontSize: 14 }}>표시할 장소가 없습니다.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredPlaces.map((p) => (
              <li
                key={`${p.id ?? p.name}-${p.created_at ?? ''}`}
                style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}
              >
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#555' }}>
                  카테고리: {p.category_key || '-'}
                  {p.description ? ` • ${p.description}` : ''}
                </div>
                {p.url ? (
                  <div style={{ fontSize: 12 }}>
                    <a href={p.url} target="_blank" rel="noreferrer">
                      링크
                    </a>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}