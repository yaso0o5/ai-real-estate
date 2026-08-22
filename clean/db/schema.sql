-- Neon/Postgres schema for the clean build
create table if not exists properties(
 id text primary key,
 city text not null,
 district text not null,
 type text not null,
 status text not null default 'For Sale',
 price numeric not null,
 area numeric not null,
 listed_at timestamptz not null default now()
);
create index if not exists properties_city_idx on properties(city);
create index if not exists properties_district_idx on properties(district);
create index if not exists properties_listed_at_idx on properties(listed_at desc);
