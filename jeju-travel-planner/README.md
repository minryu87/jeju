# Jeju Travel Planner

Next.js 14 + TypeScript + Tailwind CSS + lucide-react + Leaflet 기반의 제주 여행 플래너 데모입니다.

## 실행 방법
```bash
cd /workspace/jeju-travel-planner
npm install
npm run dev
```

- App Viewer에서 미리보기로 확인하세요.
- 배포가 필요하면 App Viewer 상단의 Publish 버튼으로 퍼블릭 링크를 생성하세요.

## 기술 메모
- 지도는 Leaflet를 동적 로딩(브라우저 전용)으로 사용합니다. 컴포넌트와 페이지는 "use client"로 렌더링하여 SSR 환경에서 window 참조 에러를 방지했습니다.
- 데이터 영구 저장은 포함되어 있지 않습니다. 새로 추가한 장소는 메모리 내에서만 유지됩니다.
- 레이아웃 검증을 위해 디버그 로그 및 컬러 보더(왼쪽 빨강, 오른쪽 파랑)를 유지했습니다.

## 검증 체크리스트
- lg 이상(≥1024px) 화면에서 좌/우 2열, 모바일에서 1열 스택.
- 지도 마커에 이모지 혹은 선택 순번 표시.
- 일정 선택 시 경로가 반영되고 점선 폴리라인 표시.

## 작업 요약
- 사용자 명세대로 파일을 생성/덮어쓰기 완료.
- 의존성 설치 후 Lint/Build 정상 완료.
- App Viewer에서 UI 검증 가이드에 따라 확인 요청.