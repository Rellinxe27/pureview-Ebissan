-- ============================================================
-- Sample customer feedback / reviews for the dashboard.
-- Run once in the Supabase SQL Editor.
-- Safe to re-run: clients are de-duped by name, and feedback is
-- only seeded if you don't have any yet.
-- ============================================================

do $$
declare
  uid uuid;
  c_john uuid; c_sarah uuid; c_mike uuid; c_emily uuid; c_lisa uuid; c_david uuid;
begin
  -- 1) Resolve the user. EDIT this email if you log in with a different one.
  select id into uid from auth.users where email = 'rellinxe@gmail.com' order by created_at limit 1;
  if uid is null then
    raise exception 'No auth user found for that email — edit the email at the top of this script.';
  end if;

  -- 2) Clients (de-duped by name; created if missing)
  select id into c_john  from clients where user_id = uid and name = 'John Smith'    limit 1;
  if c_john  is null then insert into clients(user_id,name,email,city,state) values (uid,'John Smith','john@example.com','Miami','FL') returning id into c_john;  end if;
  select id into c_sarah from clients where user_id = uid and name = 'Sarah Johnson' limit 1;
  if c_sarah is null then insert into clients(user_id,name,email,city,state) values (uid,'Sarah Johnson','sarah@example.com','Miami','FL') returning id into c_sarah; end if;
  select id into c_mike  from clients where user_id = uid and name = 'Mike Brown'    limit 1;
  if c_mike  is null then insert into clients(user_id,name,email,city,state) values (uid,'Mike Brown','mike@example.com','Miami','FL') returning id into c_mike;  end if;
  select id into c_emily from clients where user_id = uid and name = 'Emily Davis'   limit 1;
  if c_emily is null then insert into clients(user_id,name,email,city,state) values (uid,'Emily Davis','emily@example.com','Miami','FL') returning id into c_emily; end if;
  select id into c_lisa  from clients where user_id = uid and name = 'Lisa Martinez' limit 1;
  if c_lisa  is null then insert into clients(user_id,name,email,city,state) values (uid,'Lisa Martinez','lisa@example.com','Miami','FL') returning id into c_lisa;  end if;
  select id into c_david from clients where user_id = uid and name = 'David Chen'    limit 1;
  if c_david is null then insert into clients(user_id,name,email,city,state) values (uid,'David Chen','david@example.com','Miami','FL') returning id into c_david; end if;

  -- 3) Feedback — only if this user has none yet
  if (select count(*) from feedback where user_id = uid) = 0 then
    insert into feedback(user_id, client_id, rating, comment, date) values
      (uid, c_john,  5, 'Excellent service! My windows have never been so clean. Very professional and on time.', current_date - 1),
      (uid, c_sarah, 5, 'Great work repairing my screens. Fast, friendly, and reasonably priced. Highly recommend!', current_date - 3),
      (uid, c_mike,  4, 'They are my go-to for window cleaning. Always do an amazing job!', current_date - 5),
      (uid, c_emily, 5, 'Spotless windows and great attention to detail. Will definitely book again.', current_date - 8),
      (uid, c_lisa,  4, 'Reliable and thorough. Showed up right on schedule and left everything sparkling.', current_date - 11),
      (uid, c_david, 5, 'Best window cleaning service in Miami. Friendly team and fair pricing.', current_date - 14);
  end if;
end $$;
