// 제주 여행 플래너 타입 정의

export interface Place {
  id: number;
  name: string;
  category: string;
  lat: number;
  lng: number;
  image: string;
  description: string;
  time: string;
  fee: string;
  url?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: any;
  color: string;
}

export interface Weather {
  icon: any;
  text: string;
  temp: string;
}

export interface Flight {
  departure: string;
  arrival: string;
}

export interface Accommodation {
  checkin?: string;
  checkout?: string;
}

export interface Schedule {
  date: string;
  title: string;
  weather: Weather;
  flight?: Flight;
  accommodation?: Accommodation;
  places: number[];
  times: string[];
}

export interface NewPlace {
  name: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  time: string;
  fee: string;
  url: string;
  image: string;
}
