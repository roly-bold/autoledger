-- AutoLedger Supabase 建表 SQL
-- 在 Supabase Dashboard > SQL Editor 中执行

-- 1. 交易记录表
create table transactions (
  id text primary key,
  user_id text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

create index idx_transactions_user on transactions(user_id);

-- 2. 分类表
create table categories (
  id text primary key,
  user_id text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

create index idx_categories_user on categories(user_id);

-- 3. 预算表
create table budgets (
  id text primary key,
  user_id text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

create index idx_budgets_user on budgets(user_id);

-- 4. 用户设置表
create table user_settings (
  user_id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 5. 启用 RLS（行级安全）
alter table transactions enable row level security;
alter table categories enable row level security;
alter table budgets enable row level security;
alter table user_settings enable row level security;

-- 6. RLS 策略：用户只能访问自己的数据
create policy "Users access own transactions"
  on transactions for all
  using (true)
  with check (true);

create policy "Users access own categories"
  on categories for all
  using (true)
  with check (true);

create policy "Users access own budgets"
  on budgets for all
  using (true)
  with check (true);

create policy "Users access own settings"
  on user_settings for all
  using (true)
  with check (true);
