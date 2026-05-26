-- Supabase Database Schema for Pingaksh Luxury Watch Store

-- 1. Enable UUID Extension if not enabled
create extension if not exists "uuid-ossp";

-- 2. Create Products Table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  price numeric not null,
  image text not null,
  category text not null check (category in ('Classic', 'Sport', 'Minimalist', 'Luxury')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security for products (Anyone can view products, Admins can write)
alter table public.products enable row level security;

create policy "Allow public view access to products"
  on public.products for select
  using (true);

create policy "Allow admin write access to products"
  on public.products for all
  using (
    auth.jwt() ->> 'email' = 'chanchaltailor404@gmail.com'
  );

-- 3. Create Profiles Table (user accounts)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text unique not null,
  role text default 'customer' not null check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for profiles
alter table public.profiles enable row level security;

create policy "Allow users to read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow admin full access to profiles"
  on public.profiles for all
  using (
    auth.jwt() ->> 'email' = 'chanchaltailor404@gmail.com'
  );

-- Automatic Profile Creation Trigger when a User registers with Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Anonymous Collector'),
    new.email,
    case when new.email = 'chanchaltailor404@gmail.com' then 'admin' else 'customer' end
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Create Cart Items Table (Cloud-synced persistent shopping carts)
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- Turn on RLS for cart_items (Users can only access their own cart items)
alter table public.cart_items enable row level security;

create policy "Allow users to read their own cart items"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Allow users to manage their own cart items"
  on public.cart_items for all
  using (auth.uid() = user_id);

-- 5. Create Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_email text not null,
  customer_phone text,
  total numeric not null check (total >= 0),
  status text not null default 'calibrating' check (status in ('calibrating', 'transit', 'customs', 'fulfilled', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS for orders
alter table public.orders enable row level security;

create policy "Allow users to read their own orders"
  on public.orders for select
  using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'chanchaltailor404@gmail.com');

create policy "Allow authenticated user to insert order"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Allow admin update access on orders"
  on public.orders for update
  using (auth.jwt() ->> 'email' = 'chanchaltailor404@gmail.com');

-- 6. Create Order Items Table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  product_name text not null,
  price numeric not null,
  quantity integer not null check (quantity > 0)
);

-- Turn on RLS for order_items
alter table public.order_items enable row level security;

create policy "Allow users to read their own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (o.user_id = auth.uid() or auth.jwt() ->> 'email' = 'chanchaltailor404@gmail.com')
    )
  );

create policy "Allow authenticated insert to order items"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and o.user_id = auth.uid()
    )
  );

-- Enable Realtime for standard tables to support immediate live synchronization
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.cart_items;

-- 7. Seed Initial Core Luxury Watch Inventory
insert into public.products (name, price, image, category, description) values
('Aurelius Gold', 299, 'https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800', 'Luxury', 'Classic high-grade automatic calibre watch layered in gold.'),
('Centurion Black', 189, 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800', 'Classic', 'Surgical matte black stainless steel watch with high strength.'),
('Meridian Minimalist', 149, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800', 'Minimalist', 'Extremely thin steel watch with simple dials.'),
('Apex Sport Chrono', 219, 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=800', 'Sport', 'Equipped with subdials and tachymeter bezel.');
