-- Azzuri Fines — seed the fixed 2025 PSC fines list.
-- Run AFTER schema.sql. Safe to re-run: it clears and reloads fine_types.

delete from public.fine_types;

insert into public.fine_types (name, description, amount, sort_order) values
  ('AWOL (Game)', 'Not showing up to Game without notice', 10, 1),
  ('Late (Training/Game)', '', 5, 2),
  ('Late with Kit', 'Late to game with the Kit or Balls', 10, 3),
  ('Yellow Card', '', 5, 4),
  ('Red Card', '', 10, 5),
  ('Own Goal', '', 10, 6),
  ('Missed Penalty', '', 10, 7),
  ('Oh Dear', 'A clear and obvious mishap on the pitch', 5, 8),
  ('No shower after game', '', 5, 9),
  ('No drink after game', '', 5, 10),
  ('Missing Kit', '', 5, 11),
  ('Missing Toiletries (towel/shower gel)', '', 5, 12),
  ('Caught Diving', '', 5, 13),
  ('FTLBE (failure to lead by example)', 'Coach & Captains predominantly', 5, 14),
  ('Hangover', '', 5, 15),
  ('MDS (match day strop)', 'Strop: a hissy fit, tantrum, argument etc.', 5, 16),
  ('Pub/Club House Strop', '', 5, 17),
  ('Nutmeg', 'Ball through the legs', 5, 18),
  ('Shit Linesman', '', 5, 19),
  ('Shit Warm up', 'If people do not participate or participate poorly', 5, 20),
  ('Shit set Piece', 'Corner/Freekick', 5, 21),
  ('Conceding a penalty', '', 10, 22),
  ('Dodgy back pass', '', 5, 23),
  ('Holiday', 'Fine for every game missed', 5, 24),
  ('MISC', 'Miscellaneous: For any mishap in the season, outside of this list, that warrants a fine.', 5, 25),
  ('Club Polo', 'Not wearing a club polo on game day', 5, 26),
  ('Sook', 'Being a sook: A cry-baby, a complainer, a whinger; a wimp.', 5, 27),
  ('Chummy', 'Being overly friendly with the opposition before/during/after a game.', 5, 28),
  ('Foul throw', '', 5, 29),
  ('Nation not making 2026 World Cup', '', 5, 30),
  ('GOOSE!', '', 10, 31);
