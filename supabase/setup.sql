-- =====================================================================
--  둘이서 — Supabase 설정
--  Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여넣고 Run.
--  여러 번 실행해도 안전하다 (이미 있는 건 건너뛰거나 다시 만든다).
-- =====================================================================

-- ---------- 테이블 ----------

-- 커플 한 쌍
create table if not exists public.couples (
  id          uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  start_date  date,                         -- 사귄 날 (D+1 = 이 날)
  wall        text not null default 'cream',
  floor       text not null default 'wood',
  created_by  uuid references auth.users(id) on delete set null,
  member_ids  uuid[] not null default '{}', -- 지금까지 들어온 사람들. 처음 연결된 두 사람만 다시 들어올 수 있다
  created_at  timestamptz not null default now()
);

-- 커플 구성원 (최대 2명, 한 사람은 한 커플에만)
create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  nickname  text not null default '',
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);
create unique index if not exists couple_members_one_couple on public.couple_members(user_id);

-- 캘린더 기록 (사진 + 메모)
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day        date not null,
  memo       text not null default '',
  photo_path text,
  thumb_path text,
  created_at timestamptz not null default now()
);
create index if not exists entries_couple_day on public.entries(couple_id, day);

-- 질문 답변 (question_id는 앱 data.js의 id)
create table if not exists public.answers (
  couple_id   uuid not null references public.couples(id) on delete cascade,
  question_id text not null,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  answer      text not null,
  created_at  timestamptz not null default now(),
  primary key (couple_id, question_id, user_id)
);

-- 밸런스 게임 선택
create table if not exists public.balance_picks (
  couple_id  uuid not null references public.couples(id) on delete cascade,
  item_id    text not null,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pick       text not null check (pick in ('a','b')),
  created_at timestamptz not null default now(),
  primary key (couple_id, item_id, user_id)
);

-- 우리 방 오브제 (산 물건 = 한 줄, placed면 방에 놓인 상태)
create table if not exists public.room_items (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  object_key text not null,
  x          real not null default 50,
  y          real not null default 70,
  scale      real not null default 1,
  flip       boolean not null default false,
  placed     boolean not null default false,
  bought_by  uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists room_items_couple on public.room_items(couple_id);

-- 같이 하고 싶은 것 목록 — 영화(movie) · 가고 싶은 곳(place). done_on = 같이 본 날 / 다녀온 날
create table if not exists public.wishes (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples(id) on delete cascade,
  kind       text not null check (kind in ('movie','place')),
  title      text not null check (char_length(title) between 1 and 200),
  memo       text not null default '',
  added_by   uuid default auth.uid() references auth.users(id) on delete set null,
  done_on    date,
  lat        double precision,              -- 장소만: 카카오맵 좌표
  lng        double precision,
  address    text,
  place_url  text,                          -- 카카오맵 장소 페이지
  place_cat  text,                          -- food · cafe · dessert · bar · play · trip · etc
  parent_id  uuid references public.wishes(id) on delete cascade,   -- 어느 장소 안에서 갈 곳인지 (예: 북촌 한옥마을 → 그 근처 카페)
  created_at timestamptz not null default now()
);
-- 장소 안에 갈 곳을 넣는 칸 (이 칸이 생기기 전에 만든 테이블에도 추가)
alter table public.wishes add column if not exists parent_id uuid references public.wishes(id) on delete cascade;
create index if not exists wishes_couple on public.wishes(couple_id);
create index if not exists wishes_parent on public.wishes(parent_id);

-- 같이 본 영화 · 다녀온 곳의 별점 (한 사람당 하나)
create table if not exists public.wish_reviews (
  wish_id    uuid not null references public.wishes(id) on delete cascade,
  couple_id  uuid not null references public.couples(id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  review     text not null default '',
  created_at timestamptz not null default now(),
  primary key (wish_id, user_id)
);
create index if not exists wish_reviews_couple on public.wish_reviews(couple_id);

-- ---------- 멤버 확인 함수 ----------
-- security definer: 정책 안에서 couple_members를 다시 읽을 때 생기는 RLS 무한 재귀를 막는다.
create or replace function public.is_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.couple_members where couple_id = cid and user_id = auth.uid());
$$;

create or replace function public.is_member_text(cid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.couple_members where couple_id::text = cid and user_id = auth.uid());
$$;

-- ---------- 행 단위 보안 (둘만 서로의 데이터를 본다) ----------
alter table public.couples        enable row level security;
alter table public.couple_members enable row level security;
alter table public.entries        enable row level security;
alter table public.answers        enable row level security;
alter table public.balance_picks  enable row level security;
alter table public.room_items     enable row level security;
alter table public.wishes         enable row level security;
alter table public.wish_reviews   enable row level security;

drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples for select to authenticated using (public.is_member(id));
drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples for update to authenticated
  using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists members_select on public.couple_members;
create policy members_select on public.couple_members for select to authenticated using (public.is_member(couple_id));
drop policy if exists members_update on public.couple_members;
create policy members_update on public.couple_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists entries_select on public.entries;
create policy entries_select on public.entries for select to authenticated using (public.is_member(couple_id));
drop policy if exists entries_insert on public.entries;
create policy entries_insert on public.entries for insert to authenticated
  with check (public.is_member(couple_id) and user_id = auth.uid());
drop policy if exists entries_update on public.entries;
create policy entries_update on public.entries for update to authenticated
  using (user_id = auth.uid()) with check (public.is_member(couple_id) and user_id = auth.uid());
drop policy if exists entries_delete on public.entries;
create policy entries_delete on public.entries for delete to authenticated using (user_id = auth.uid());

drop policy if exists answers_select on public.answers;
create policy answers_select on public.answers for select to authenticated using (public.is_member(couple_id));
drop policy if exists answers_insert on public.answers;
create policy answers_insert on public.answers for insert to authenticated
  with check (public.is_member(couple_id) and user_id = auth.uid());
drop policy if exists answers_update on public.answers;
create policy answers_update on public.answers for update to authenticated
  using (user_id = auth.uid()) with check (public.is_member(couple_id) and user_id = auth.uid());
drop policy if exists answers_delete on public.answers;
create policy answers_delete on public.answers for delete to authenticated using (user_id = auth.uid());

drop policy if exists picks_select on public.balance_picks;
create policy picks_select on public.balance_picks for select to authenticated using (public.is_member(couple_id));
drop policy if exists picks_insert on public.balance_picks;
create policy picks_insert on public.balance_picks for insert to authenticated
  with check (public.is_member(couple_id) and user_id = auth.uid());
drop policy if exists picks_update on public.balance_picks;
create policy picks_update on public.balance_picks for update to authenticated
  using (user_id = auth.uid()) with check (public.is_member(couple_id) and user_id = auth.uid());

drop policy if exists room_select on public.room_items;
create policy room_select on public.room_items for select to authenticated using (public.is_member(couple_id));
drop policy if exists room_insert on public.room_items;
create policy room_insert on public.room_items for insert to authenticated with check (public.is_member(couple_id));
drop policy if exists room_update on public.room_items;
create policy room_update on public.room_items for update to authenticated
  using (public.is_member(couple_id)) with check (public.is_member(couple_id));
drop policy if exists room_delete on public.room_items;
create policy room_delete on public.room_items for delete to authenticated using (public.is_member(couple_id));

-- 목록은 둘이 같이 쓴다 (누가 담았든 둘 다 고치고 지울 수 있다)
drop policy if exists wishes_select on public.wishes;
create policy wishes_select on public.wishes for select to authenticated using (public.is_member(couple_id));
drop policy if exists wishes_insert on public.wishes;
create policy wishes_insert on public.wishes for insert to authenticated
  with check (public.is_member(couple_id) and added_by = auth.uid()
              and (parent_id is null
                   or exists (select 1 from public.wishes p where p.id = wishes.parent_id and p.couple_id = wishes.couple_id)));
drop policy if exists wishes_update on public.wishes;
create policy wishes_update on public.wishes for update to authenticated
  using (public.is_member(couple_id)) with check (public.is_member(couple_id));
drop policy if exists wishes_delete on public.wishes;
create policy wishes_delete on public.wishes for delete to authenticated using (public.is_member(couple_id));

-- 별점은 내 것만 쓰고 고친다. 같은 커플의 목록에만 달 수 있다
drop policy if exists wish_reviews_select on public.wish_reviews;
create policy wish_reviews_select on public.wish_reviews for select to authenticated using (public.is_member(couple_id));
drop policy if exists wish_reviews_insert on public.wish_reviews;
create policy wish_reviews_insert on public.wish_reviews for insert to authenticated
  with check (public.is_member(couple_id) and user_id = auth.uid()
              and exists (select 1 from public.wishes w where w.id = wish_id and w.couple_id = wish_reviews.couple_id));
drop policy if exists wish_reviews_update on public.wish_reviews;
create policy wish_reviews_update on public.wish_reviews for update to authenticated
  using (user_id = auth.uid())
  with check (public.is_member(couple_id) and user_id = auth.uid()
              and exists (select 1 from public.wishes w where w.id = wish_id and w.couple_id = wish_reviews.couple_id));
drop policy if exists wish_reviews_delete on public.wish_reviews;
create policy wish_reviews_delete on public.wish_reviews for delete to authenticated using (user_id = auth.uid());

-- 앱에서 고칠 수 있는 칸만 열어 둔다. 초대 코드·구성원 기록·소속 커플은 아래 함수로만 바뀐다.
revoke update on public.couples from anon, authenticated;
grant  update (start_date, wall, floor) on public.couples to authenticated;
revoke update on public.couple_members from anon, authenticated;
grant  update (nickname) on public.couple_members to authenticated;
revoke update on public.wishes from anon, authenticated;
grant  update (title, memo, done_on, place_cat) on public.wishes to authenticated;

-- ---------- 커플 만들기 / 초대 코드로 들어가기 / 연결 끊기 ----------
create or replace function public.create_couple(p_nickname text, p_start date)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid  uuid;
  code text;
  abc  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   -- 헷갈리는 0 O 1 I 제외
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from couple_members where user_id = auth.uid()) then raise exception 'already_in_couple'; end if;
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(abc, 1 + floor(random() * length(abc))::int, 1);
    end loop;
    exit when not exists (select 1 from couples where invite_code = code);
  end loop;
  insert into couples (invite_code, start_date, created_by, member_ids)
    values (code, p_start, auth.uid(), array[auth.uid()]) returning id into cid;
  insert into couple_members (couple_id, user_id, nickname) values (cid, auth.uid(), coalesce(trim(p_nickname), ''));
  return cid;
end $$;

create or replace function public.join_couple(p_code text, p_nickname text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
  ids uuid[];
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if exists (select 1 from couple_members where user_id = auth.uid()) then raise exception 'already_in_couple'; end if;
  -- for update: 두 사람이 동시에 들어와도 한 명씩 처리되게 잠근다
  select id, member_ids into cid, ids from couples where invite_code = upper(trim(p_code)) for update;
  if cid is null then raise exception 'code_not_found'; end if;
  -- 지금 두 명이 있거나, 이미 두 사람이 연결됐던 커플이면 (헤어진 뒤 새 사람이 옛 기록을 보지 못하게) 그 두 사람만 들어올 수 있다
  if (select count(*) from couple_members where couple_id = cid) >= 2
     or (cardinality(ids) >= 2 and not (auth.uid() = any(ids))) then
    raise exception 'couple_full';
  end if;
  insert into couple_members (couple_id, user_id, nickname) values (cid, auth.uid(), coalesce(trim(p_nickname), ''));
  if not (auth.uid() = any(ids)) then
    update couples set member_ids = array_append(member_ids, auth.uid()) where id = cid;
  end if;
  return cid;
end $$;

-- 나가기. 마지막 한 명까지 나가면 커플 데이터 전체가 지워진다.
create or replace function public.leave_couple()
returns void language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
begin
  select couple_id into cid from couple_members where user_id = auth.uid();
  if cid is null then return; end if;
  delete from couple_members where couple_id = cid and user_id = auth.uid();
  if not exists (select 1 from couple_members where couple_id = cid) then
    delete from couples where id = cid;
  end if;
end $$;

revoke execute on function public.create_couple(text, date) from public, anon;
revoke execute on function public.join_couple(text, text)   from public, anon;
revoke execute on function public.leave_couple()            from public, anon;
grant  execute on function public.create_couple(text, date) to authenticated;
grant  execute on function public.join_couple(text, text)   to authenticated;
grant  execute on function public.leave_couple()            to authenticated;
grant  execute on function public.is_member(uuid)           to authenticated;
grant  execute on function public.is_member_text(text)      to authenticated;

-- ---------- 사진 저장소 (비공개, 경로 = 커플id/파일명) ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "duriseo photos read" on storage.objects;
create policy "duriseo photos read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_member_text((storage.foldername(name))[1]));
drop policy if exists "duriseo photos upload" on storage.objects;
create policy "duriseo photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_member_text((storage.foldername(name))[1]));
drop policy if exists "duriseo photos delete" on storage.objects;
create policy "duriseo photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_member_text((storage.foldername(name))[1]));

-- ---------- 실시간 연동 ----------
do $$
declare t text;
begin
  foreach t in array array['couples','couple_members','entries','answers','balance_picks','room_items','wishes','wish_reviews'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;   -- 이미 등록됨
    end;
  end loop;
end $$;
