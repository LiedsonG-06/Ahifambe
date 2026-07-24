USE ahifambe_db;

ALTER TABLE trips
  MODIFY COLUMN status ENUM('scheduled', 'in_progress', 'completed', 'finished', 'cancelled')
  NOT NULL DEFAULT 'scheduled';
