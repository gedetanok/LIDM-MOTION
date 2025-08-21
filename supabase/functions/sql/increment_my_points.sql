-- Run this in Supabase SQL editor once to create RPC for atomic points increment
create or replace function public.increment_my_points(p_delta int)
returns void
language sql
security definer
set search_path = public
as $$
  update public.users set points = coalesce(points,0) + p_delta
  where id = auth.uid();
$$;

grant execute on function public.increment_my_points(int) to authenticated;

