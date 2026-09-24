-- ============================================================
-- TANGZEE — DATABASE SCHEMA (Supabase Postgres)
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- CUSTOMERS
-- ------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  email_verified boolean not null default false,
  phone text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_email_or_phone check (email is not null or phone is not null)
);

-- ------------------------------------------------------------
-- OTP CODES (email verification, used by /api/otp/send + /verify)
-- ------------------------------------------------------------
create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index otp_codes_email_idx on otp_codes (email);

-- ------------------------------------------------------------
-- ADMIN USERS (linked to Supabase Auth users)
-- ------------------------------------------------------------
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'staff' check (role in ('owner','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- DESSERTS
-- ------------------------------------------------------------
create table desserts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  category text,
  available boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CAMPAIGNS
-- ------------------------------------------------------------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_code text unique not null,
  title text not null,
  featured_dessert_id uuid references desserts(id),
  poster_image_url text,
  start_date date,
  end_date date,
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','PAUSED','EXPIRED','ARCHIVED')),
  reward_description text default '2 FOR THE PRICE OF 1',
  claim_limit_per_customer int not null default 1,
  views_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CAMPAIGN CLAIMS
-- ------------------------------------------------------------
create table campaign_claims (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  campaign_id uuid not null references campaigns(id),
  claim_code text unique not null,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE','REDEEMED','EXPIRED')),
  redeemed_at timestamptz,
  redeemed_by uuid references admin_users(id),
  photo_url text,
  unique (customer_id, campaign_id)
);

-- ------------------------------------------------------------
-- CAMPAIGN REDEMPTIONS (append-only log; claim row holds live state)
-- ------------------------------------------------------------
create table campaign_redemptions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references campaign_claims(id),
  customer_id uuid not null references customers(id),
  campaign_id uuid not null references campaigns(id),
  redeemed_at timestamptz not null default now(),
  redeemed_by uuid references admin_users(id),
  status text not null default 'COMPLETED'
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid not null references customers(id),
  total_amount numeric(10,2) not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING','COMPLETED','CANCELLED','REFUNDED')),
  created_by uuid references admin_users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz
);

-- ------------------------------------------------------------
-- ORDER ITEMS
-- ------------------------------------------------------------
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  dessert_id uuid not null references desserts(id),
  quantity int not null check (quantity > 0),
  price_at_purchase numeric(10,2) not null
);

-- ------------------------------------------------------------
-- LOYALTY CYCLES
-- ------------------------------------------------------------
create table loyalty_cycles (
  customer_id uuid primary key references customers(id),
  current_progress int not null default 0 check (current_progress between 0 and 7),
  completed_cycles int not null default 0,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MINI DESSERT CLAIMS
-- ------------------------------------------------------------
create table mini_dessert_claims (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  cycle_number int not null,
  dessert_id uuid references desserts(id),
  claimed_at timestamptz not null default now(),
  claimed_by uuid references admin_users(id),
  unique (customer_id, cycle_number)
);

-- ------------------------------------------------------------
-- AUDIT LOGS
-- ------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references admin_users(id),
  action text not null,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- COSTS (owner-entered, used to compute real profit in Analytics)
-- ------------------------------------------------------------
-- Raw material cost: owner logs it whenever bought, usually daily.
-- Multiple entries per day are fine (e.g. two purchases) — summed
-- per month when computing profit.
create table raw_material_costs (
  id uuid primary key default gen_random_uuid(),
  cost_date date not null,
  amount numeric(10,2) not null check (amount >= 0),
  note text,
  created_by uuid references admin_users(id),
  created_at timestamptz not null default now()
);
create index raw_material_costs_date_idx on raw_material_costs (cost_date);

-- Staff salary + electricity bill: these are one number per month, so
-- the owner enters/updates them once (e.g. at month end) and it
-- applies to that whole month. "month" is always stored as the 1st.
create table monthly_costs (
  id uuid primary key default gen_random_uuid(),
  month date not null unique,
  staff_salary numeric(10,2) not null default 0,
  electricity_bill numeric(10,2) not null default 0,
  updated_by uuid references admin_users(id),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- SHOP SETTINGS (single row)
-- ------------------------------------------------------------
create table shop_settings (
  id int primary key default 1,
  shop_name text default 'Tangzee',
  address text,
  phone text,
  opening_hours text,
  instagram text,
  website text,
  google_maps_link text,
  currency text default 'INR',
  default_mini_dessert_id uuid references desserts(id),
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  featured_image_url text,
  check (id = 1)
);
insert into shop_settings (id) values (1);

-- ============================================================
-- SERVER-SIDE BUSINESS LOGIC (the rules the frontend must never own)
-- ============================================================

-- Claim a campaign: enforces active/date window + one-claim-per-customer,
-- generates a unique claim code.
create or replace function claim_campaign(p_customer_id uuid, p_campaign_code text, p_photo_url text default null)
returns campaign_claims
language plpgsql
security definer
as $$
declare
  v_campaign campaigns;
  v_claim campaign_claims;
  v_code text;
begin
  select * into v_campaign from campaigns where campaign_code = p_campaign_code;
  if not found then
    raise exception 'CAMPAIGN_NOT_FOUND';
  end if;
  if v_campaign.status <> 'ACTIVE' then
    raise exception 'CAMPAIGN_NOT_ACTIVE';
  end if;
  if v_campaign.start_date is not null and current_date < v_campaign.start_date then
    raise exception 'CAMPAIGN_NOT_STARTED';
  end if;
  if v_campaign.end_date is not null and current_date > v_campaign.end_date then
    raise exception 'CAMPAIGN_EXPIRED';
  end if;

  if exists (select 1 from campaign_claims where customer_id = p_customer_id and campaign_id = v_campaign.id) then
    raise exception 'ALREADY_CLAIMED';
  end if;

  v_code := v_campaign.campaign_code || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  insert into campaign_claims (customer_id, campaign_id, claim_code, photo_url)
  values (p_customer_id, v_campaign.id, v_code, p_photo_url)
  returning * into v_claim;

  update campaigns set updated_at = now() where id = v_campaign.id;

  return v_claim;
end;
$$;

-- Redeem a claim code: enforces AVAILABLE -> REDEEMED exactly once.
create or replace function redeem_campaign_claim(p_claim_code text, p_admin_id uuid)
returns campaign_claims
language plpgsql
security definer
as $$
declare
  v_claim campaign_claims;
begin
  select * into v_claim from campaign_claims where claim_code = p_claim_code for update;
  if not found then
    raise exception 'CLAIM_NOT_FOUND';
  end if;
  if v_claim.status = 'REDEEMED' then
    raise exception 'ALREADY_REDEEMED';
  end if;

  update campaign_claims
  set status = 'REDEEMED', redeemed_at = now(), redeemed_by = p_admin_id
  where id = v_claim.id
  returning * into v_claim;

  insert into campaign_redemptions (claim_id, customer_id, campaign_id, redeemed_by)
  values (v_claim.id, v_claim.customer_id, v_claim.campaign_id, p_admin_id);

  insert into audit_logs (actor_id, action, record_id) values (p_admin_id, 'CAMPAIGN_REDEEMED', v_claim.id);

  return v_claim;
end;
$$;

-- Complete an order: enforces PENDING -> COMPLETED exactly once,
-- and advances the loyalty cycle by exactly one step.
create or replace function complete_order(p_order_id uuid, p_admin_id uuid)
returns orders
language plpgsql
security definer
as $$
declare
  v_order orders;
  v_cycle loyalty_cycles;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'PENDING' then
    raise exception 'ORDER_NOT_PENDING';
  end if;

  update orders set status = 'COMPLETED', completed_at = now()
  where id = p_order_id returning * into v_order;

  insert into loyalty_cycles (customer_id, current_progress)
  values (v_order.customer_id, 1)
  on conflict (customer_id) do update
    set current_progress = loyalty_cycles.current_progress + 1,
        updated_at = now()
  returning * into v_cycle;

  insert into audit_logs (actor_id, action, record_id) values (p_admin_id, 'ORDER_COMPLETED', v_order.id);

  return v_order;
end;
$$;

-- Claim the mini dessert at 7/7: enforces exactly-once per cycle, resets progress.
create or replace function claim_mini_dessert(p_customer_id uuid, p_admin_id uuid, p_dessert_id uuid default null)
returns mini_dessert_claims
language plpgsql
security definer
as $$
declare
  v_cycle loyalty_cycles;
  v_mdc mini_dessert_claims;
  v_dessert uuid;
begin
  select * into v_cycle from loyalty_cycles where customer_id = p_customer_id for update;
  if not found or v_cycle.current_progress < 7 then
    raise exception 'NOT_ELIGIBLE';
  end if;

  v_dessert := coalesce(p_dessert_id, (select default_mini_dessert_id from shop_settings where id = 1));

  insert into mini_dessert_claims (customer_id, cycle_number, dessert_id, claimed_by)
  values (p_customer_id, v_cycle.completed_cycles + 1, v_dessert, p_admin_id)
  returning * into v_mdc;

  update loyalty_cycles
  set current_progress = 0, completed_cycles = completed_cycles + 1, updated_at = now()
  where customer_id = p_customer_id;

  insert into audit_logs (actor_id, action, record_id) values (p_admin_id, 'MINI_DESSERT_CLAIMED', v_mdc.id);

  return v_mdc;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table customers enable row level security;
alter table campaigns enable row level security;
alter table campaign_claims enable row level security;
alter table campaign_redemptions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table loyalty_cycles enable row level security;
alter table mini_dessert_claims enable row level security;
alter table admin_users enable row level security;
alter table audit_logs enable row level security;
alter table desserts enable row level security;
alter table shop_settings enable row level security;
alter table otp_codes enable row level security;
alter table raw_material_costs enable row level security;
alter table monthly_costs enable row level security;

-- Public (anon) can read active desserts/campaigns/shop settings only.
create policy "public read available desserts" on desserts for select using (available = true);
create policy "public read active campaigns" on campaigns for select using (status = 'ACTIVE');
create policy "public read shop settings" on shop_settings for select using (true);

-- All writes and every other read happen only through the service role
-- (i.e. from Next.js server routes, never directly from the browser).
-- No further policies are added for INSERT/UPDATE/DELETE, so RLS blocks
-- them from the anon/browser key by default — this is intentional.
