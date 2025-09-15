-- schema.sql 시작
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
