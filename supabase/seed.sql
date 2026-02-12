insert into public.tags (name)
values
  ('technology'),
  ('finance'),
  ('healthcare'),
  ('education'),
  ('retail'),
  ('media')
on conflict (name) do nothing;
