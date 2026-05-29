-- CF-1: 사전상담(pre_consult)으로 생성된 예약에 담당 디자이너가 없으면
-- 원장(role='owner')을 자동 배정한다. 그래야 사장님 스케줄표에서 '미지정'이 아닌
-- 원장 칸에 바로 표시된다. (샵 고정 링크 경로 dbCreateBookingFromShopLink는 designer_id 미설정)
create or replace function public.assign_owner_designer_to_preconsult()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.designer_id is null and new.channel = 'pre_consult' then
    select d.id into new.designer_id
    from public.designers d
    where d.shop_id = new.shop_id and d.role = 'owner' and d.is_active = true
    order by d.created_at
    limit 1;
  end if;
  return new;
end;
$$;

-- 트리거 함수는 트리거로만 실행되므로 직접 실행 권한 회수
revoke execute on function public.assign_owner_designer_to_preconsult() from anon, authenticated;

drop trigger if exists trg_assign_owner_designer on public.booking_requests;
create trigger trg_assign_owner_designer
before insert on public.booking_requests
for each row execute function public.assign_owner_designer_to_preconsult();

-- 기존 미지정 사전상담 예약 백필 (멱등: designer_id가 null인 것만 채움)
update public.booking_requests b
set designer_id = (
  select d.id from public.designers d
  where d.shop_id = b.shop_id and d.role = 'owner' and d.is_active = true
  order by d.created_at limit 1
)
where b.designer_id is null
  and b.channel = 'pre_consult'
  and exists (
    select 1 from public.designers d
    where d.shop_id = b.shop_id and d.role = 'owner' and d.is_active = true
  );
