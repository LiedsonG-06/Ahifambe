USE ahifambe_db;

UPDATE drivers
SET status = 'active'
WHERE status = 'pending';

ALTER TABLE drivers
  MODIFY COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active';
