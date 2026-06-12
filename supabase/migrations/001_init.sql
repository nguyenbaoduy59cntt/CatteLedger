-- Catte Ledger initial schema

create extension if not exists "pgcrypto";

create type round_type as enum ('NORMAL', 'BURN', 'PENALTY');
create type settlement_status as enum ('PENDING', 'CONFIRMED', 'REJECTED');

create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  password_hash text not null,
  owner_id uuid not null references users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null references users(id),
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_room_members_room_active on room_members(room_id, is_active);
create index idx_room_members_user on room_members(user_id);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  created_by uuid not null references users(id),
  winner_id uuid not null references users(id),
  round_type round_type not null,
  penalty_payer_id uuid references users(id),
  player_snapshot jsonb not null,
  amount_per_loser integer not null,
  loser_count integer not null,
  total_amount integer not null,
  is_rolled_back boolean not null default false,
  rolled_back_at timestamptz,
  rolled_back_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index idx_rounds_room on rounds(room_id, created_at desc);

create table round_transactions (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  debtor_id uuid not null references users(id),
  creditor_id uuid not null references users(id),
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table user_balances (
  id uuid primary key default gen_random_uuid(),
  debtor_id uuid not null references users(id),
  creditor_id uuid not null references users(id),
  amount integer not null check (amount > 0),
  updated_at timestamptz not null default now(),
  unique (debtor_id, creditor_id),
  check (debtor_id <> creditor_id)
);

create index idx_user_balances_debtor on user_balances(debtor_id);
create index idx_user_balances_creditor on user_balances(creditor_id);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  debtor_id uuid not null references users(id),
  creditor_id uuid not null references users(id),
  amount integer not null check (amount > 0),
  status settlement_status not null default 'PENDING',
  requested_by uuid not null references users(id),
  confirmed_by uuid references users(id),
  rejected_by uuid references users(id),
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  check (debtor_id <> creditor_id)
);

create index idx_settlements_creditor on settlements(creditor_id, status);
create index idx_settlements_debtor on settlements(debtor_id, status);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, created_at desc);

-- Enable realtime for notifications
alter publication supabase_realtime add table notifications;
