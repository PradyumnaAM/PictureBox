-- =============================================================================
-- increment_vote — atomically adjust a group_item's vote_count
-- =============================================================================
-- Replaces the read-then-write pattern in /api/groups/[id]/vote with a single
-- atomic UPDATE so concurrent votes can't clobber each other's count. Clamped
-- at 0 so an unvote can never push the count negative. Returns the new count.

create or replace function public.increment_vote(item_id uuid, delta integer)
returns integer
language sql
volatile
as $$
  update public.group_items
  set vote_count = greatest(0, coalesce(vote_count, 0) + delta)
  where id = item_id
  returning vote_count;
$$;

grant execute on function public.increment_vote(uuid, integer) to authenticated, service_role;
