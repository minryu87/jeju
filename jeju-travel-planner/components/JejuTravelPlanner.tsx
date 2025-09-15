"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapPin, Calendar, Coffee, Utensils, Mountain,
  Activity, Heart, Camera, Navigation, Plus, X, Clock,
  Plane, Home, Cloud, Sun, CloudRain
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

declare global {
  interface Window {
    L: any;
  }
}

type Place = {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  image: string;
  description: string;
  time: string;
  fee: string;
  url: string;
};

type Schedule = {
  date: string;
  title: string;
  weather: { icon: any; text: string; temp: string };
  flight?: { departure: string; arrival: string } | null;
  accommodation?: { checkin?: string; checkout?: string } | null;
  places: number[];
  times: string[];
};

const iconFromString = (key?: string) => {
  const k = (key || "").toLowerCase();
  if (k.includes("rain")) return CloudRain;
  if (k.includes("sun")) return Sun;
  if (k.includes("cloud")) return Cloud;
  return Cloud;
};

const JejuTravelPlanner: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [showPlaceDetail, setShowPlaceDetail] = useState<Place | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 디버그 로그
  useEffect(() => {
    console.log("🎯 JejuTravelPlanner 컴포넌트 마운트됨");
    console.log("📱 현재 화면 크기:", window.innerWidth, "x", window.innerHeight);
    console.log("🖥️ 레이아웃 모드:", window.innerWidth >= 1024 ? "Desktop (lg 이상)" : "Mobile");

    setTimeout(() => {
      const container = document.querySelector(".layout-container");
      const leftPanel = document.querySelector(".left-panel");
      const rightPanel = document.querySelector(".right-panel");

      console.log("📦 레이아웃 컨테이너:", container ? "✅ 존재" : "❌ 없음");
      console.log("👈 왼쪽 패널:", leftPanel ? "✅ 존재" : "❌ 없음");
      console.log("👉 오른쪽 패널:", rightPanel ? "✅ 존재" : "❌ 없음");

      if (container) {
        const computedStyle = window.getComputedStyle(container as Element);
        console.log("🎨 Grid 템플릿:", (computedStyle as any).gridTemplateColumns);
        console.log("📏 컨테이너 너비:", computedStyle.width);
        console.log("🔧 Display 속성:", computedStyle.display);
      }

      if (leftPanel) {
        const leftStyle = window.getComputedStyle(leftPanel as Element);
        console.log("👈 왼쪽 패널 너비:", leftStyle.width);
        console.log("👈 왼쪽 패널 배경:", leftStyle.backgroundColor);
      }

      if (rightPanel) {
        const rightStyle = window.getComputedStyle(rightPanel as Element);
        console.log("👉 오른쪽 패널 너비:", rightStyle.width);
        console.log("👉 오른쪽 패널 배경:", rightStyle.backgroundColor);
      }

      console.log(
        "🎨 Tailwind CSS grid-cols-2 적용 확인:",
        container?.classList.contains("lg:grid-cols-2") ? "✅" : "❌"
      );
    }, 1000);
  }, []);

  // 선택된 장소 변경 시 디버그
  useEffect(() => {
    console.log("📍 선택된 장소 변경:", selectedPlaces.length, "개");
    selectedPlaces.forEach((place, index) => {
      console.log(`  ${index + 1}. ${place.name} (${place.category})`);
    });
  }, [selectedPlaces]);

  // 장소 데이터 (fallback)
  const [places, setPlaces] = useState<Place[]>([
    { id: 0, name: "제주국제공항", category: "transport", lat: 33.5113, lng: 126.4928, image: "✈️", description: "제주여행의 시작과 끝. 김포-제주 항공편 이용.", time: "30분", fee: "주차료 별도", url: "" },
    { id: 1, name: "이끼숲소길", category: "nature", lat: 33.4234, lng: 126.2456, image: "🌿", description: "신비로운 이끼 정원을 품은 카페. 계절마다 다른 꽃을 감상할 수 있는 숨은 명소.", time: "1-2시간", fee: "입장료 별도", url: "" },
    { id: 2, name: "돌낭예술원", category: "culture", lat: 33.4512, lng: 126.3234, image: "🎨", description: "돌을 활용한 독특한 예술 작품들을 전시하는 야외 갤러리. SNS 인기 스팟.", time: "1시간", fee: "성인 8,000원", url: "" },
    { id: 3, name: "송당동화마을", category: "culture", lat: 33.4789, lng: 126.3567, image: "🏘️", description: "동화 속 같은 예쁜 마을. 포토존이 많아 연인들에게 인기.", time: "1-2시간", fee: "무료", url: "" },
    { id: 4, name: "비양도", category: "nature", lat: 33.3955, lng: 126.2397, image: "🏝️", description: "협재해변에서 도보로 갈 수 있는 작은 섬. 일몰이 아름다운 곳.", time: "2-3시간", fee: "무료", url: "" },
    { id: 5, name: "수월봉", category: "nature", lat: 33.3045, lng: 126.1634, image: "⛰️", description: "제주 서쪽 끝에 위치한 화산 응회환. 억새밭과 일몰 명소.", time: "1-2시간", fee: "무료", url: "" },
    { id: 6, name: "카페 몽상 드 애월", category: "cafe", lat: 33.4616, lng: 126.3094, image: "☕", description: "애월 해안도로의 대표 오션뷰 카페. 넓은 창으로 바다를 감상.", time: "1시간", fee: "음료 8,000원~", url: "" },
    { id: 7, name: "애월빵공장앤카페", category: "cafe", lat: 33.4234, lng: 126.2945, image: "🥐", description: "곽지해수욕장 앞 유명 베이커리 카페. 소금빵이 인기.", time: "1시간", fee: "음료 6,000원~", url: "" },
    { id: 8, name: "블루보틀 제주점", category: "cafe", lat: 33.4997, lng: 126.5312, image: "☕", description: "제주 첫 블루보틀 매장. 통창으로 보는 제주 자연이 일품.", time: "1시간", fee: "음료 7,000원~", url: "" },
    { id: 9, name: "그럼외도", category: "cafe", lat: 33.4456, lng: 126.3123, image: "🌱", description: "제주의 감성을 느낄 수 있는 힐링 카페. 조용하고 아늑한 분위기.", time: "1-2시간", fee: "음료 7,000원~", url: "" },
    { id: 10, name: "숙성도", category: "restaurant", lat: 33.4556, lng: 126.3045, image: "🥓", description: "애월 최고의 흑돼지 맛집. 현지인도 인정하는 진짜 맛집.", time: "1-2시간", fee: "1인 25,000원~", url: "" },
    { id: 11, name: "당당", category: "restaurant", lat: 33.4634, lng: 126.3123, image: "🥗", description: "애월의 감성 브런치 카페. 건강한 재료로 만든 브런치가 유명.", time: "1-2시간", fee: "브런치 18,000원~", url: "" },
    { id: 12, name: "임순이네밥집", category: "restaurant", lat: 33.4589, lng: 126.3067, image: "🍲", description: "정통 제주 몸국을 맛볼 수 있는 로컬 맛집. 진짜 제주 맛.", time: "1시간", fee: "몸국 12,000원", url: "" },
    { id: 13, name: "FCMM스포츠파크X소울빌리지", category: "activity", lat: 33.2456, lng: 126.4234, image: "🎾", description: "테니스, 풋살 등을 즐길 수 있는 복합 스포츠시설. 바다 전망 테니스 코트.", time: "2-3시간", fee: "테니스 코트 1시간 40,000원", url: "https://naver.me/5cA6n3Qk" },
    { id: 14, name: "한담해변 투명카약", category: "activity", lat: 33.4502, lng: 126.3012, image: "🛶", description: "투명한 바닥의 카약으로 제주 바다 속을 구경할 수 있는 체험.", time: "1-2시간", fee: "1인 35,000원", url: "" },
    { id: 15, name: "협재해변 패러세일링", category: "activity", lat: 33.3941, lng: 126.2397, image: "🪂", description: "하늘에서 내려다보는 협재해변의 에메랄드빛 바다.", time: "30분", fee: "1인 80,000원", url: "" },
    { id: 16, name: "한림공원", category: "culture", lat: 33.4144, lng: 126.2689, image: "🌺", description: "아열대식물원과 용암동굴을 함께 즐길 수 있는 복합 관광지.", time: "2-3시간", fee: "성인 10,000원", url: "" },
    { id: 17, name: "제주애월애 독채펜션", category: "accommodation", lat: 33.4616, lng: 126.3094, image: "🏠", description: "숙소 위치. 애월 해안가 근처의 독채 펜션.", time: "숙박", fee: "1박 기준", url: "" }
  ]);

  // 일정 데이터 (fallback)
  const schedules: Record<string, Schedule> = {
    day1: { date: "9/19 (금)", title: "도착일 - 실내 관광 & 맛집", weather: { icon: CloudRain, text: "비", temp: "15-23°C" }, flight: { departure: "김포 08:35", arrival: "제주 09:50" }, accommodation: { checkin: "체크인 가능" }, places: [0, 17, 6, 10, 8], times: ["09:50", "10:30", "12:00", "18:30", "20:30"] },
    day2: { date: "9/20 (토)", title: "메인 관광일 - 서부 해안 & 스포츠", weather: { icon: Sun, text: "오전 비→오후 맑음", temp: "24-28°C" }, flight: null, accommodation: null, places: [14, 4, 7, 13], times: ["11:00", "13:30", "15:00", "17:00"] },
    day2_rain: { date: "9/20 (토)", title: "우천 대안 - 실내 관광", weather: { icon: CloudRain, text: "비", temp: "24-28°C" }, flight: null, accommodation: null, places: [16, 9, 2, 1], times: ["11:00", "14:00", "16:00", "18:00"] },
    day3: { date: "9/21 (일)", title: "출발일 - 서쪽 끝 탐방", weather: { icon: Sun, text: "맑음", temp: "24-28°C" }, flight: { departure: "제주 18:05", arrival: "김포 19:20" }, accommodation: { checkout: "체크아웃 08:00" }, places: [5, 15, 11, 3, 0], times: ["09:00", "11:00", "12:30", "14:00", "17:00"] }
  };

  const [dbSchedules, setDbSchedules] = useState<Record<string, Schedule> | null>(null);

  const categories = [
    { id: "all", name: "전체", icon: Heart, color: "text-pink-500" },
    { id: "transport", name: "교통/공항", icon: Plane, color: "text-indigo-500" },
    { id: "nature", name: "자연/관광", icon: Mountain, color: "text-green-500" },
    { id: "cafe", name: "카페", icon: Coffee, color: "text-yellow-600" },
    { id: "restaurant", name: "맛집", icon: Utensils, color: "text-red-500" },
    { id: "activity", name: "액티비티", icon: Activity, color: "text-blue-500" },
    { id: "culture", name: "문화/체험", icon: Camera, color: "text-purple-500" },
    { id: "accommodation", name: "숙소", icon: MapPin, color: "text-gray-500" }
  ];

  const [newPlace, setNewPlace] = useState<Place>({
    name: "",
    category: "nature",
    description: "",
    lat: 33.4,
    lng: 126.3,
    time: "",
    fee: "",
    url: "",
    image: "📍",
    id: 1000
  } as unknown as Place);

  // Supabase에서 데이터 로드 (있을 경우)
  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      console.log("🔌 Supabase 연결 시도: 환경값 존재 =", !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      try {
        const { data: placesData, error: pErr } = await supabase
          .from("places")
          .select("*")
          .order("id", { ascending: true });
        if (pErr) {
          console.error("❌ Supabase places 로드 오류:", pErr);
        } else if (placesData && placesData.length) {
          const mapped: Place[] = placesData.map((r: any) => ({
            id: Number(r.id),
            name: r.name || "",
            category: r.category_key || "nature",
            lat: typeof r.lat === "number" ? r.lat : parseFloat(r.lat ?? "0"),
            lng: typeof r.lng === "number" ? r.lng : parseFloat(r.lng ?? "0"),
            image: r.image || "📍",
            description: r.description || "",
            time: r.time || "",
            fee: r.fee || "",
            url: r.url || ""
          }));
          setPlaces(mapped);
          console.log(`✅ Supabase places 로드 완료: ${mapped.length}건`);
        }

        const { data: schedulesData, error: sErr } = await supabase
          .from("schedules")
          .select("*");
        if (sErr) {
          console.error("❌ Supabase schedules 로드 오류:", sErr);
        }

        const { data: spData, error: spErr } = await supabase
          .from("schedule_places")
          .select("*")
          .order("order_index", { ascending: true });
        if (spErr) {
          console.error("❌ Supabase schedule_places 로드 오류:", spErr);
        }

        if (schedulesData && schedulesData.length) {
          const map: Record<string, Schedule> = {};
          for (const s of schedulesData as any[]) {
            const key = s.key as string;
            const rows = (spData || []).filter((sp: any) => sp.schedule_id === s.id);
            const placesIds: number[] = rows.map((sp: any) => Number(sp.place_id));
            const times: string[] = rows.map((sp: any) => sp.time_str || "");
            map[key] = {
              date: s.date_text || "",
              title: s.title || "",
              weather: { icon: iconFromString(s.weather_icon), text: s.weather_text || "", temp: s.temp_range || "" },
              flight: (s.flight_departure || s.flight_arrival) ? { departure: s.flight_departure || "", arrival: s.flight_arrival || "" } : null,
              accommodation: (s.accommodation_checkin || s.accommodation_checkout) ? { checkin: s.accommodation_checkin || undefined, checkout: s.accommodation_checkout || undefined } : null,
              places: placesIds,
              times
            };
          }
          setDbSchedules(map);
          console.log(`✅ Supabase schedules 로드/구성 완료: ${Object.keys(map).length}건`);
        }
      } catch (e) {
        console.error("❌ Supabase 로드 중 예외 발생:", e);
      }
    };
    load();
  }, []);

  const getEffectiveSchedules = () => (dbSchedules ?? schedules);

  // 지도 초기화 (Leaflet 동적 로드)
  useEffect(() => {
    const initMap = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        document.head.appendChild(link);

        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        script.onload = () => {
          if (window.L) {
            mapInstanceRef.current = window.L.map(mapRef.current).setView([33.3617, 126.5292], 10);
            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors" }).addTo(mapInstanceRef.current);
            updateMapMarkers();
          }
        };
        document.head.appendChild(script);
      }
    };
    initMap();
  }, []);

  // 마커/경로 업데이트
  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    markersRef.current.forEach((marker) => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    const filtered = selectedCategory === "all" ? places : places.filter((p) => p.category === selectedCategory);

    filtered.forEach((place) => {
      const isSelected = selectedPlaces.find((p) => p.id === place.id);
      const selectedIndex = selectedPlaces.findIndex((p) => p.id === place.id);

      const marker = window.L.marker([place.lat, place.lng], {
        icon: window.L.divIcon({
          html: `<div style="
            background: ${isSelected ? "#ef4444" : "#3b82f6"};
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${isSelected && selectedIndex >= 0 ? selectedIndex + 1 : place.image}</div>`,
          className: "custom-marker",
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${place.name}</strong><br/>
          <small>${place.description.substring(0, 50)}...</small>
        </div>
      `);

      marker.on("click", () => {
        handlePlaceClick(place);
      });

      markersRef.current.push(marker);
    });

    if (selectedPlaces.length > 1) {
      const routeCoords = selectedPlaces.map((p) => [p.lat, p.lng]);
      const polyline = window.L.polyline(routeCoords, {
        color: "#ef4444",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 10"
      }).addTo(mapInstanceRef.current);
      markersRef.current.push(polyline);
    }
  };

  useEffect(() => {
    updateMapMarkers();
  }, [selectedCategory, selectedPlaces, places]);

  const filteredPlaces = selectedCategory === "all" ? places : places.filter((p) => p.category === selectedCategory);

  const handlePlaceClick = (place: Place) => {
    if (selectedPlaces.find((p) => p.id === place.id)) {
      setSelectedPlaces(selectedPlaces.filter((p) => p.id !== place.id));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  const handleScheduleSelect = (scheduleKey: string) => {
    const eff = getEffectiveSchedules();
    const schedule = eff[scheduleKey];
    if (!schedule) return;
    const schedulePlaces = schedule.places
      .map((id) => places.find((p) => p.id === id))
      .filter(Boolean) as Place[];
    setSelectedPlaces(schedulePlaces);
    setSelectedDay(scheduleKey);
  };

  const handleAddPlace = async () => {
    console.log("📝 새 장소 추가 시작:", newPlace);

    try {
      if (supabase) {
        const insertRow = {
          name: newPlace.name,
          category_key: newPlace.category,
          lat: newPlace.lat,
          lng: newPlace.lng,
          image: newPlace.image,
          description: newPlace.description,
          time: newPlace.time,
          fee: newPlace.fee,
          url: newPlace.url
        };
        const { data, error } = await supabase.from("places").insert([insertRow]).select().single();
        if (error) {
          console.error("❌ Supabase places insert 오류:", error);
        } else if (data) {
          const added: Place = {
            id: Number(data.id),
            name: data.name,
            category: data.category_key || "nature",
            lat: Number(data.lat),
            lng: Number(data.lng),
            image: data.image || "📍",
            description: data.description || "",
            time: data.time || "",
            fee: data.fee || "",
            url: data.url || ""
          };
          console.log("✅ Supabase에 추가된 장소:", added);
          setPlaces((prev) => [...prev, added]);
        }
      } else {
        // 로컬 fallback
        const newId = Math.max(...places.map((p) => p.id), 0) + 1;
        const placeToAdd: Place = {
          ...newPlace,
          id: newId,
          lat: Number(newPlace.lat),
          lng: Number(newPlace.lng)
        };
        console.log("📍 추가될 장소(로컬):", placeToAdd);
        setPlaces([...places, placeToAdd]);
      }
    } finally {
      setNewPlace({
        name: "",
        category: "nature",
        description: "",
        lat: 33.4,
        lng: 126.3,
        time: "",
        fee: "",
        url: "",
        image: "📍",
        id: Math.max(...places.map((p) => p.id), 0) + 2
      } as unknown as Place);

      setShowAddForm(false);
      console.log("✅ 새 장소 추가 완료");
    }
  };

  const getCurrentSchedule = () => {
    const eff = getEffectiveSchedules();
    return selectedDay ? eff[selectedDay] : null;
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  // 렌더링 디버그
  console.log("🔄 JejuTravelPlanner 렌더링 중... (인라인 CSS Grid 적용)");
  console.log("🗓️ 선택된 일정:", selectedDay);
  console.log("📂 선택된 카테고리:", selectedCategory);
  console.log("📍 선택된 장소 수:", selectedPlaces.length);
  console.log("🎯 예상 결과: 빨간 박스와 파란 박스가 나란히 50%씩 표시되어야 함");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* 헤더 */}
      <header className="bg-white shadow-lg border-b-4 border-pink-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🌺 사랑하는 찐빵이와 행복한 제주 여행 🌺
            </h1>
            <p className="text-lg text-gray-600 italic">아이브로우의 진화 - 더욱 정교해진 여행 계획</p>
            <p className="text-sm text-gray-500 mt-2">서쪽 지역 위주 • 2박 3일 여행 • 실시간 지도</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 디버그 정보 표시 */}
        <div className="mb-4 p-2 bg-yellow-100 text-xs">
          <div>🖥️ 화면: {typeof window !== "undefined" ? window.innerWidth : "unknown"}px</div>
          <div>📱 모드: {typeof window !== "undefined" && window.innerWidth >= 1024 ? "Desktop" : "Mobile"}</div>
          <div>🗓️ 선택된 일정: {selectedDay || "없음"}</div>
          <div>📍 선택된 장소: {selectedPlaces.length}개</div>
        </div>

        <div className="layout-container grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-96">
          {/* 왼쪽 패널 */}
          <div className="left-panel border-4 border-red-500 bg-red-50 rounded-lg p-4">
            <h2 className="text-xl font-bold text-red-800 mb-4">👈 왼쪽 패널 (일정/카테고리)</h2>
            <div className="space-y-4">
              {/* 일정 선택 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calendar className="mr-2" size={20} />
                  여행 일정
                  {selectedDay && (
                    <button
                      onClick={() => {
                        setSelectedDay(null);
                        setSelectedPlaces([]);
                      }}
                      className="ml-auto bg-red-100 text-red-600 px-2 py-1 rounded text-sm"
                    >
                      초기화
                    </button>
                  )}
                </h3>

                <div className="space-y-3">
                  {Object.entries(getEffectiveSchedules()).map(([key, schedule]) => {
                    const WeatherIcon = schedule.weather.icon;
                    return (
                      <div
                        key={key}
                        onClick={() => handleScheduleSelect(key)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                          selectedDay === key ? "bg-blue-50 border-blue-300" : "bg-gray-50 hover:bg-gray-100 border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-gray-800">{schedule.date}</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <WeatherIcon size={16} className="mr-1" />
                            {schedule.weather.text}
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 mb-2">{schedule.title}</div>
                        <div className="text-xs text-gray-500">{schedule.weather.temp}</div>

                        {schedule.flight && (
                          <div className="flex items-center text-xs text-blue-600 mt-2">
                            <Plane size={12} className="mr-1" />
                            {schedule.flight?.departure} → {schedule.flight?.arrival}
                          </div>
                        )}

                        {schedule.accommodation && (
                          <div className="flex items-center text-xs text-green-600 mt-1">
                            <Home size={12} className="mr-1" />
                            {schedule.accommodation?.checkin || schedule.accommodation?.checkout}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 카테고리 필터 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Navigation className="mr-2" size={20} />
                  카테고리
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`p-2 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                          selectedCategory === category.id ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <IconComponent className={`mr-1 ${category.color}`} size={16} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 장소 목록 */}
              <div className="bg-white rounded-lg shadow-md p-4 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">
                  장소 목록
                  <span className="text-sm text-gray-500 ml-2">({filteredPlaces.length}개)</span>
                </h3>
                <div className="space-y-2">
                  {filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => handlePlaceClick(place)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedPlaces.find((p) => p.id === place.id) ? "bg-blue-100 border-2 border-blue-300" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{place.image}</span>
                            <span className="font-medium">{place.name}</span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {place.time} • {place.fee}
                          </div>
                        </div>
                        {selectedPlaces.find((p) => p.id === place.id) && (
                          <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {selectedPlaces.findIndex((p) => p.id === place.id) + 1}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 새 장소 추가 버튼 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full p-3 bg-purple-100 hover:bg-purple-200 rounded-lg text-left transition-colors flex items-center"
                >
                  <Plus className="mr-2" size={20} />
                  <div>
                    <div className="font-semibold text-purple-800">새 장소 추가</div>
                    <div className="text-sm text-purple-600">발견한 숨은 명소를 추가하세요</div>
                  </div>
                </button>
              </div>

              {/* 새 장소 추가 폼 */}
              {showAddForm && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">새 장소 추가</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">장소명</label>
                      <input
                        type="text"
                        value={newPlace.name}
                        onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="장소 이름을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">카테고리</label>
                      <select
                        value={newPlace.category}
                        onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        {categories.filter((c) => c.id !== "all").map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">설명</label>
                      <textarea
                        value={newPlace.description}
                        onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg h-16"
                        placeholder="장소에 대한 설명을 입력하세요"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">위도</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newPlace.lat}
                          onChange={(e) => setNewPlace({ ...newPlace, lat: parseFloat(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="33.4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">경도</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={newPlace.lng}
                          onChange={(e) => setNewPlace({ ...newPlace, lng: parseFloat(e.target.value) })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="126.3"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">소요시간</label>
                        <input
                          type="text"
                          value={newPlace.time}
                          onChange={(e) => setNewPlace({ ...newPlace, time: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="1-2시간"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">비용</label>
                        <input
                          type="text"
                          value={newPlace.fee}
                          onChange={(e) => setNewPlace({ ...newPlace, fee: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="무료 또는 가격"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">URL (선택)</label>
                      <input
                        type="url"
                        value={newPlace.url}
                        onChange={(e) => setNewPlace({ ...newPlace, url: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="https://..."
                      />
                    </div>

                    <button
                      onClick={handleAddPlace}
                      disabled={!newPlace.name || !newPlace.description}
                      className="w-full py-2 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      장소 추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 패널 - 지도/경로 */}
          <div className="right-panel border-4 border-blue-500 bg-blue-50 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-800 mb-4">👉 오른쪽 패널 (지도/경로)</h2>
            <div className="space-y-4">
              {/* 지도 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <MapPin className="mr-2" size={20} />
                  제주도 서부 지역 지도
                </h3>
                <div
                  ref={mapRef}
                  className="w-full h-64 rounded-lg border-2 border-gray-300 bg-gray-200"
                  style={{ minHeight: "256px" }}
                >
                  <div className="flex items-center justify-center h-full text-gray-500">
                    지도 로딩 중...
                  </div>
                </div>
              </div>

              {/* 경로 및 시간 안내 */}
              {selectedPlaces.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Clock className="mr-2" size={20} />
                    추천 경로 및 시간표
                    <span className="ml-2 text-sm text-gray-500">({selectedPlaces.length}곳)</span>
                  </h3>

                  {getCurrentSchedule() && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-blue-800">{getCurrentSchedule()?.date}</div>
                        <div className="text-sm text-blue-600">{getCurrentSchedule()?.title}</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedPlaces.map((place, index) => {
                      const schedule = getCurrentSchedule();
                      const timeSlot = schedule?.times?.[index] || `${9 + index * 2}:00`;

                      return (
                        <div key={place.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{place.name}</div>
                              <div className="text-sm text-gray-600 flex items-center">
                                <Clock size={14} className="mr-1" />
                                {formatTime(timeSlot)}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">{place.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              소요시간: {place.time} | 비용: {place.fee}
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedPlaces(selectedPlaces.filter((p) => p.id !== place.id))}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {selectedPlaces.length > 1 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>총 예상 시간:</strong> {selectedPlaces.length * 2}시간 (이동시간 포함)
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        렌터카 이용 시 장소 간 이동시간은 평균 20-30분입니다.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

console.log("✅ JejuTravelPlanner 컴포넌트 정의 완료");

export default JejuTravelPlanner;