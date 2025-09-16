import {
  MapPin, Calendar, Coffee, Utensils, Mountain, ShoppingBag,
  Activity, Heart, Camera, Navigation, Plane, Home, Cloud, Sun, CloudRain
} from 'lucide-react';
import { Place, Category, Schedule } from './types';

// 제주도 서부 지역 장소 데이터
export const places: Place[] = [
  // 교통/공항
  { id: 0, name: '제주국제공항', category: 'transport', lat: 33.5113, lng: 126.4928,
    image: '✈️', description: '제주여행의 시작과 끝. 김포-제주 항공편 이용.',
    time: '30분', fee: '주차료 별도' },

  // 자연/관광지
  { id: 1, name: '이끼숲소길', category: 'nature', lat: 33.4234, lng: 126.2456,
    image: '🌿', description: '신비로운 이끼 정원을 품은 카페. 계절마다 다른 꽃을 감상할 수 있는 숨은 명소.',
    time: '1-2시간', fee: '입장료 별도' },
  { id: 2, name: '돌낭예술원', category: 'culture', lat: 33.4512, lng: 126.3234,
    image: '🎨', description: '돌을 활용한 독특한 예술 작품들을 전시하는 야외 갤러리. SNS 인기 스팟.',
    time: '1시간', fee: '성인 8,000원' },
  { id: 3, name: '송당동화마을', category: 'culture', lat: 33.4789, lng: 126.3567,
    image: '🏘️', description: '동화 속 같은 예쁜 마을. 포토존이 많아 연인들에게 인기.',
    time: '1-2시간', fee: '무료' },
  { id: 4, name: '비양도', category: 'nature', lat: 33.3955, lng: 126.2397,
    image: '🏝️', description: '협재해변에서 도보로 갈 수 있는 작은 섬. 일몰이 아름다운 곳.',
    time: '2-3시간', fee: '무료' },
  { id: 5, name: '수월봉', category: 'nature', lat: 33.3045, lng: 126.1634,
    image: '⛰️', description: '제주 서쪽 끝에 위치한 화산 응회환. 억새밭과 일몰 명소.',
    time: '1-2시간', fee: '무료' },

  // 카페
  { id: 6, name: '카페 몽상 드 애월', category: 'cafe', lat: 33.4616, lng: 126.3094,
    image: '☕', description: '애월 해안도로의 대표 오션뷰 카페. 넓은 창으로 바다를 감상.',
    time: '1시간', fee: '음료 8,000원~' },
  { id: 7, name: '애월빵공장앤카페', category: 'cafe', lat: 33.4234, lng: 126.2945,
    image: '🥐', description: '곽지해수욕장 앞 유명 베이커리 카페. 소금빵이 인기.',
    time: '1시간', fee: '음료 6,000원~' },
  { id: 8, name: '블루보틀 제주점', category: 'cafe', lat: 33.4997, lng: 126.5312,
    image: '☕', description: '제주 첫 블루보틀 매장. 통창으로 보는 제주 자연이 일품.',
    time: '1시간', fee: '음료 7,000원~' },
  { id: 9, name: '그럼외도', category: 'cafe', lat: 33.4456, lng: 126.3123,
    image: '🌱', description: '제주의 감성을 느낄 수 있는 힐링 카페. 조용하고 아늑한 분위기.',
    time: '1-2시간', fee: '음료 7,000원~' },

  // 맛집
  { id: 10, name: '숙성도', category: 'restaurant', lat: 33.4556, lng: 126.3045,
    image: '🥓', description: '애월 최고의 흑돼지 맛집. 현지인도 인정하는 진짜 맛집.',
    time: '1-2시간', fee: '1인 25,000원~' },
  { id: 11, name: '당당', category: 'restaurant', lat: 33.4634, lng: 126.3123,
    image: '🥗', description: '애월의 감성 브런치 카페. 건강한 재료로 만든 브런치가 유명.',
    time: '1-2시간', fee: '브런치 18,000원~' },
  { id: 12, name: '임순이네밥집', category: 'restaurant', lat: 33.4589, lng: 126.3067,
    image: '🍲', description: '정통 제주 몸국을 맛볼 수 있는 로컬 맛집. 진짜 제주 맛.',
    time: '1시간', fee: '몸국 12,000원' },

  // 액티비티
  { id: 13, name: 'FCMM스포츠파크X소울빌리지', category: 'activity', lat: 33.2456, lng: 126.4234,
    image: '🎾', description: '테니스, 풋살 등을 즐길 수 있는 복합 스포츠시설. 바다 전망 테니스 코트.',
    time: '2-3시간', fee: '테니스 코트 1시간 40,000원', url: 'https://naver.me/5cA6n3Qk' },
  { id: 14, name: '한담해변 투명카약', category: 'activity', lat: 33.4502, lng: 126.3012,
    image: '🛶', description: '투명한 바닥의 카약으로 제주 바다 속을 구경할 수 있는 체험.',
    time: '1-2시간', fee: '1인 35,000원' },
  { id: 15, name: '협재해변 패러세일링', category: 'activity', lat: 33.3941, lng: 126.2397,
    image: '🪂', description: '하늘에서 내려다보는 협재해변의 에메랄드빛 바다.',
    time: '30분', fee: '1인 80,000원' },

  // 기타
  { id: 16, name: '한림공원', category: 'culture', lat: 33.4144, lng: 126.2689,
    image: '🌺', description: '아열대식물원과 용암동굴을 함께 즐길 수 있는 복합 관광지.',
    time: '2-3시간', fee: '성인 10,000원' },
  { id: 17, name: '제주애월애 독채펜션', category: 'accommodation', lat: 33.4616, lng: 126.3094,
    image: '🏠', description: '숙소 위치. 애월 해안가 근처의 독채 펜션.',
    time: '숙박', fee: '1박 기준' }
];

export const categories: Category[] = [
  { id: 'all', name: '전체', icon: Heart, color: 'text-pink-500' },
  { id: 'transport', name: '교통/공항', icon: Plane, color: 'text-indigo-500' },
  { id: 'nature', name: '자연/관광', icon: Mountain, color: 'text-green-500' },
  { id: 'cafe', name: '카페', icon: Coffee, color: 'text-yellow-600' },
  { id: 'restaurant', name: '맛집', icon: Utensils, color: 'text-red-500' },
  { id: 'activity', name: '액티비티', icon: Activity, color: 'text-blue-500' },
  { id: 'culture', name: '문화/체험', icon: Camera, color: 'text-purple-500' },
  { id: 'accommodation', name: '숙소', icon: MapPin, color: 'text-gray-500' }
];

export const schedules: Record<string, Schedule> = {
  day1: {
    date: '9/19 (금)',
    title: '도착일 - 실내 관광 & 맛집',
    weather: { icon: CloudRain, text: '비', temp: '15-23°C' },
    flight: { departure: '김포 08:35', arrival: '제주 09:50' },
    accommodation: { checkin: '체크인 가능' },
    places: [0, 17, 6, 10, 8],
    times: ['09:50', '10:30', '12:00', '18:30', '20:30']
  },
  day2: {
    date: '9/20 (토)',
    title: '메인 관광일 - 서부 해안 & 스포츠',
    weather: { icon: Sun, text: '오전 비→오후 맑음', temp: '24-28°C' },
    places: [14, 4, 7, 13],
    times: ['11:00', '13:30', '15:00', '17:00']
  },
  day2_rain: {
    date: '9/20 (토)',
    title: '우천 대안 - 실내 관광',
    weather: { icon: CloudRain, text: '비', temp: '24-28°C' },
    places: [16, 9, 2, 1],
    times: ['11:00', '14:00', '16:00', '18:00']
  },
  day3: {
    date: '9/21 (일)',
    title: '출발일 - 서쪽 끝 탐방',
    weather: { icon: Sun, text: '맑음', temp: '24-28°C' },
    flight: { departure: '제주 18:05', arrival: '김포 19:20' },
    accommodation: { checkout: '체크아웃 08:00' },
    places: [5, 15, 11, 3, 0],
    times: ['09:00', '11:00', '12:30', '14:00', '17:00']
  }
};
