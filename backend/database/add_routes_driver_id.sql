USE ahifambe_db;

ALTER TABLE routes
ADD COLUMN driver_id INT NULL,
ADD CONSTRAINT fk_routes_driver
FOREIGN KEY (driver_id) REFERENCES drivers(id)
ON DELETE SET NULL;
