USE ahifambe_db;

ALTER TABLE trips
  ADD COLUMN lotacao ENUM('vazio', 'intermedio', 'lotado') NOT NULL DEFAULT 'vazio' AFTER status;
