-- Chạy toàn bộ file này trong Supabase: SQL Editor → New query → Run

-- Bảng bộ thẻ
create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Bảng thẻ
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null,
  back text not null,
  known boolean not null default false,
  created_at timestamptz not null default now()
);

-- Chỉ mục để truy vấn nhanh hơn
create index if not exists cards_deck_id_idx on cards(deck_id);
create index if not exists decks_user_id_idx on decks(user_id);

-- Bật Row Level Security: mỗi người chỉ thấy dữ liệu của chính mình
alter table decks enable row level security;
alter table cards enable row level security;

create policy "Chỉ chủ sở hữu xem và sửa bộ thẻ"
  on decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Chỉ chủ sở hữu xem và sửa thẻ"
  on cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);