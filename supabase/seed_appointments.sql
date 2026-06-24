-- ============================================================
-- Sample appointments + clients for the dashboard
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: clients are de-duped by name, and appointments
-- are only seeded if you don't have any yet.
-- ============================================================

do $$
declare
  uid        uuid;
  svc_window uuid;
  svc_screen uuid;
  c_john uuid; c_sarah uuid; c_mike uuid; c_emily uuid;
begin
  -- 1) Resolve the user. EDIT this email if you log in with a different one.
  select id into uid from auth.users where email = 'rellinxe@gmail.com' order by created_at limit 1;
  if uid is null then
    raise exception 'No auth user found for that email — edit the email at the top of this script.';
  end if;

  -- 2) Ensure the two services exist (created on signup, but be safe)
  select id into svc_window from services where user_id = uid and name ilike '%window%' limit 1;
  select id into svc_screen from services where user_id = uid and name ilike '%screen%' limit 1;
  if svc_window is null then
    insert into services(user_id, name, description, base_price, color)
    values (uid, 'Window Cleaning', 'Interior and exterior window cleaning', 150, '#2563eb')
    returning id into svc_window;
  end if;
  if svc_screen is null then
    insert into services(user_id, name, description, base_price, color)
    values (uid, 'Screen Repair', 'Window screen repair and replacement', 75, '#8b5cf6')
    returning id into svc_screen;
  end if;

  -- 3) Clients (de-duped by name)
  select id into c_john  from clients where user_id = uid and name = 'John Smith'    limit 1;
  if c_john  is null then insert into clients(user_id,name,email,phone,address,city,state) values (uid,'John Smith','john@example.com','(305) 555-0101','123 Main St','Miami','FL') returning id into c_john;  end if;
  select id into c_sarah from clients where user_id = uid and name = 'Sarah Johnson' limit 1;
  if c_sarah is null then insert into clients(user_id,name,email,phone,address,city,state) values (uid,'Sarah Johnson','sarah@example.com','(305) 555-0102','456 Oak Ave','Miami','FL') returning id into c_sarah; end if;
  select id into c_mike  from clients where user_id = uid and name = 'Mike Brown'    limit 1;
  if c_mike  is null then insert into clients(user_id,name,email,phone,address,city,state) values (uid,'Mike Brown','mike@example.com','(305) 555-0103','789 Pine Rd','Miami','FL') returning id into c_mike;  end if;
  select id into c_emily from clients where user_id = uid and name = 'Emily Davis'   limit 1;
  if c_emily is null then insert into clients(user_id,name,email,phone,address,city,state) values (uid,'Emily Davis','emily@example.com','(305) 555-0104','321 Maple Dr','Miami','FL') returning id into c_emily; end if;

  -- 4) Appointments — only if this user has none yet
  if (select count(*) from appointments where user_id = uid) = 0 then

    -- Upcoming (show in the dashboard "Upcoming Appointments" card + calendar)
    insert into appointments(user_id, client_id, service_id, scheduled_at, status, address, price) values
      (uid, c_john,  svc_window, (current_date + 1) + time '10:00', 'confirmed', '123 Main St, Miami, FL', 150),
      (uid, c_sarah, svc_screen, (current_date + 1) + time '13:00', 'confirmed', '456 Oak Ave, Miami, FL', 75),
      (uid, c_mike,  svc_window, (current_date + 2) + time '09:00', 'pending',   '789 Pine Rd, Miami, FL', 150),
      (uid, c_emily, svc_window, (current_date + 2) + time '14:30', 'confirmed', '321 Maple Dr, Miami, FL', 180);

    -- Completed earlier this month (drive revenue, stat cards, donut, trend, monthly bar)
    insert into appointments(user_id, client_id, service_id, scheduled_at, status, address, price) values
      (uid, c_john,  svc_window, (date_trunc('month', current_date)::date + 2)  + time '11:00', 'completed', '123 Main St, Miami, FL', 150),
      (uid, c_sarah, svc_screen, (date_trunc('month', current_date)::date + 5)  + time '15:00', 'completed', '456 Oak Ave, Miami, FL', 75),
      (uid, c_mike,  svc_window, (date_trunc('month', current_date)::date + 8)  + time '10:00', 'completed', '789 Pine Rd, Miami, FL', 200),
      (uid, c_emily, svc_window, (date_trunc('month', current_date)::date + 12) + time '13:30', 'completed', '321 Maple Dr, Miami, FL', 180),
      (uid, c_john,  svc_screen, (date_trunc('month', current_date)::date + 15) + time '09:30', 'completed', '123 Main St, Miami, FL', 90);

  end if;
end $$;
