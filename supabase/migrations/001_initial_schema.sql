-- ============================================================================
-- Market Fix — AI Marketplace заведений Алматы
-- Начальная схема Supabase (PostgreSQL).
-- Дата: 2026-08-08
-- ============================================================================

-- Расширения
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------
-- Таблица: venues — карточки заведений
-- -----------------------------------------------------------------------
create table if not exists public.venues (
    venue_id              text primary key,
    name                  text not null,
    category              text,
    subcategory           text,
    cuisines              text[] default '{}',
    price_segment         text check (price_segment in
                          ('budget','budget_mid','mid','upper_mid','premium','luxury','unknown')),
    average_check         integer,
    district              text,
    address               text,
    latitude              double precision,
    longitude             double precision,
    phone                 text,
    whatsapp              text,
    website               text,
    instagram             text,
    two_gis_url           text,
    google_maps_url       text,
    tripadvisor_url       text,
    menu_url              text,
    booking_url           text,
    booking_available     boolean default false,
    booking_method        text,
    deposit_required      boolean,
    deposit_amount        integer,
    working_hours         text,
    kitchen_hours         text,
    capacity              integer,

    -- Инфраструктура (null = не найдено)
    wifi                  boolean,
    parking               boolean,
    free_parking          boolean,
    paid_parking          boolean,
    valet                 boolean,
    smoking               boolean,
    terrace               boolean,
    outdoor_seating       boolean,
    air_conditioning      boolean,
    accessible            boolean,
    kids_chairs           boolean,
    kids_room             boolean,
    pet_friendly          boolean,
    wardrobe              boolean,
    power_outlets         boolean,
    laptop_friendly       boolean,
    private_room          boolean,
    vip_room              boolean,
    banquet_hall          boolean,
    banquet_available     boolean,

    -- Еда и кухня
    vegetarian            boolean,
    vegan                 boolean,
    halal                 boolean,
    seafood               boolean,
    meat                  boolean,
    desserts              boolean,
    breakfast             boolean,
    brunch                boolean,
    business_lunch        boolean,
    kids_menu             boolean,
    wine_card             boolean,
    live_music            boolean,

    -- Услуги
    delivery              boolean,
    takeaway              boolean,
    catering              boolean,
    gift_certificates     boolean,
    loyalty_program       boolean,

    -- Рейтинги и популярность
    rating_2gis           double precision,
    reviews_2gis          integer,
    rating_google         double precision,
    reviews_google        integer,
    rating_tripadvisor    double precision,
    reviews_tripadvisor   integer,

    -- AI и аналитика
    atmosphere            text[] default '{}',
    best_for              text[] default '{}',
    scenarios             jsonb default '{}',
    pros                  text[] default '{}',
    cons                  text[] default '{}',
    ai_score              integer default 0,
    confidence            text,
    popularity_level      text,
    data_completeness     text,
    verification_status   text default 'candidate',
    last_verified_at      date default '2026-08-08',
    source_urls           text[] default '{}',

    created_at            timestamptz default now(),
    updated_at            timestamptz default now()
);

-- -----------------------------------------------------------------------
-- Таблица: menu_items — позиции меню заведений
-- -----------------------------------------------------------------------
create table if not exists public.menu_items (
    id                  uuid primary key default gen_random_uuid(),
    venue_id            text references public.venues(venue_id) on delete cascade,
    name                text not null,
    category            text check (category in
                        ('breakfast','brunch','appetizer','salad','soup','main_course',
                         'steak','seafood','sushi','pizza','pasta','burger','ramen',
                         'grill','national_dish','side_dish','dessert','coffee','tea',
                         'soft_drink','cocktail','wine','beer','kids_menu',
                         'business_lunch','banquet_menu','unknown')),
    price               integer,
    currency            text default 'KZT',
    description         text,
    portion_size        text,
    available           text default 'unknown',
    menu_source_url     text,
    checked_at          date default '2026-08-08',
    verification_status text default 'partially_verified'
);

create index if not exists idx_menu_items_venue_id on public.menu_items(venue_id);

-- -----------------------------------------------------------------------
-- Таблица: scenario_scores — оценки сценариев 0–5
-- (опционально: можно хранить внутри venues.scenarios jsonb)
-- -----------------------------------------------------------------------
create table if not exists public.scenario_scores (
    id            uuid primary key default gen_random_uuid(),
    venue_id      text references public.venues(venue_id) on delete cascade,
    scenario_name text not null check (scenario_name in
                  ('date','family','business','friends','birthday','banquet',
                   'corporate','tourist','laptop','large_group')),
    score         integer not null check (score >= 0 and score <= 5),
    unique (venue_id, scenario_name)
);

create index if not exists idx_scenario_venue on public.scenario_scores(venue_id);

-- -----------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------
alter table public.venues enable row level security;
alter table public.menu_items enable row level security;
alter table public.scenario_scores enable row level security;

-- Публичный доступ на чтение (catalog MVP)
create policy "Public read venues"   on public.venues   for select using (true);
create policy "Public read menu"     on public.menu_items for select using (true);
create policy "Public read scenario" on public.scenario_scores for select using (true);

-- Запись только аутентифицированным
create policy "Auth write venues"   on public.venues   for all using (auth.role() = 'authenticated');
create policy "Auth write menu"     on public.menu_items for all using (auth.role() = 'authenticated');
create policy "Auth write scenario" on public.scenario_scores for all using (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------
-- Обновление updated_at
-- -----------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_venues_touch on public.venues;
create trigger trg_venues_touch before update on public.venues
    for each row execute function public.touch_updated_at();
