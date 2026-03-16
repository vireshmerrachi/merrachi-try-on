-- Enable Row Level Security (RLS) on all tables
alter table "UserPhoto" enable row level security;
alter table "TryOnResult" enable row level security;

-- 1. Create Storage Bucket
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', true);

-- 2. Storage Policies (Secure access)
-- Allow public READ access to photos (so they can be displayed in the app)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'user-photos' );

-- RESTRICT WRITE access to only authenticated users (or service role)
-- In this app, we upload via the Remix backend using the Service Role Key,
-- so we don't need a public INSERT policy for anonymous users.
-- This prevents random people from uploading files to your bucket.

-- 3. Database Policies (Secure access)
-- Policy: Users can only see their own photos based on customerId
-- Note: Since we access the DB via Prisma in the Remix backend (server-side),
-- RLS is bypassed by the Service Role.
-- However, if you ever connect directly from the frontend, you'd need this:
-- create policy "Users can see own photos"
-- on "UserPhoto" for select
-- using ( auth.uid() = customerId ); 

-- Ideally, keep all DB interactions in the Remix Loader/Action functions.
