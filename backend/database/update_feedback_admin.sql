USE ahifambe_db;

ALTER TABLE feedback
  ADD COLUMN user_id INT NULL AFTER id,
  ADD COLUMN role ENUM('passenger', 'driver') NOT NULL DEFAULT 'passenger' AFTER user_id,
  ADD COLUMN type ENUM('reclamacao', 'sugestao', 'elogio', 'problema_operacional') NOT NULL DEFAULT 'sugestao' AFTER role,
  ADD COLUMN message TEXT NULL AFTER type,
  ADD COLUMN status ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending' AFTER comment;

UPDATE feedback f
INNER JOIN passengers p ON p.id = f.passenger_id
SET
  f.user_id = p.user_id,
  f.role = 'passenger',
  f.type = 'elogio',
  f.message = COALESCE(NULLIF(TRIM(f.comment), ''), CONCAT('Avaliacao ', f.rating, '/5'))
WHERE f.user_id IS NULL;

ALTER TABLE feedback
  ADD CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
