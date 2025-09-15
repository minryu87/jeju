# Jeju Travel Planner

Next.js 14 + TypeScript + Tailwind CSS + lucide-react + Leaflet 기반의 제주 여행 플래너 데모입니다.

## 실행 방법
- cd /workspace/jeju-travel-planner
- npm install
- npm run dev

- App Viewer에서 미리보기로 확인하세요.
- 배포가 필요하면 App Viewer 상단의 Publish 버튼으로 퍼블릭 링크를 생성하세요.

## Supabase 사용
- MGX Supabase 탭에서 연결하면 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY가 자동으로 주입됩니다.
- 수동 세팅 예시 파일을 제공했습니다: `.env.local.example`
  - .env.local에 아래 값을 채워 넣으면 됩니다.
  - NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
- 연결되어 있으면 앱은 Supabase public 스키마의 places/schedules/schedule_places를 불러오고, 새 장소를 추가하면 places 테이블에 insert 합니다.
- Supabase 연결이 없거나 오류가 발생하면, 컴포넌트는 하드코드된 fallback 데이터를 사용합니다.

## 기술 메모
- 지도는 Leaflet를 동적 로딩(브라우저 전용)으로 사용합니다. 컴포넌트와 페이지는 "use client"로 렌더링하여 SSR 환경에서 window 참조 에러를 방지했습니다.
- 데이터 영구 저장은 기본적으로 포함되어 있지 않지만, Supabase 연결 시 DB를 사용합니다. 연결되지 않은 경우 새로 추가한 장소는 메모리 내에서만 유지됩니다.
- 레이아웃 검증을 위해 디버그 로그 및 컬러 보더(왼쪽 빨강, 오른쪽 파랑)를 유지했습니다.

## 검증 체크리스트
- lg 이상(≥1024px) 화면에서 좌/우 2열(왼쪽 빨강, 오른쪽 파랑), 모바일에서 1열 스택.
- 지도 마커에 이모지 또는 선택 순번 표기.
- 일정 선택 시 선택 경로가 반영되고 점선 폴리라인 표시.
- Supabase 연결 시:
  - places 목록이 지도와 리스트에 표시
  - schedules가 있으면 일정 카드가 보이고, 선택 시 경로/시간표 반영
  - 새 장소 추가 시 Supabase insert 후 UI 갱신

## 트러블슈팅
- 설치/구동 중 에러 발생 시, 어느 단계(install/build/dev)에서 어떤 오류가 출력되는지 전체 로그와 함께 보고해 주세요. 
- 특정 환경에서 "Cannot read properties of null (reading 'matches')"가 보이면, 발생 단계와 전체 로그 경로(/root/.npm/_logs/...)를 첨부해 주세요.

실행/검증 후 보고:
- App Viewer에서 레이아웃, 지도, 마커/순번, 점선 폴리라인, 콘솔 로그가 보이는지 요약해 회신해 주세요.

실행 명령:
- cd /workspace/jeju-travel-planner && npm install && npm run dev

검증 기준:
- Desktop(≥1024px): 좌/우 2열
- Mobile: 1열
- Leaflet 지도 동작, 마커/순번, 경로 폴리라인
- Supabase 데이터 연동 동작(연결 시)