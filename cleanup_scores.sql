-- Delete test scores (scores = 0 or names containing "Test")
DELETE FROM scores WHERE score = 0 OR player_name ILIKE '%Test%';
