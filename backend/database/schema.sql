CREATE DATABASE IF NOT EXISTS ahifambe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ahifambe_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver','passenger') NOT NULL,
  status ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_status (status)
);

CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  license_number VARCHAR(80),
  phone VARCHAR(40),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_drivers_user_id (user_id),
  KEY idx_drivers_status (status),
  CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passengers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  phone VARCHAR(40),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_passengers_user_id (user_id),
  CONSTRAINT fk_passengers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NULL,
  plate_number VARCHAR(40) NOT NULL,
  model VARCHAR(100),
  capacity INT NOT NULL DEFAULT 15,
  status ENUM('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vehicles_plate_number (plate_number),
  KEY idx_vehicles_driver_id (driver_id),
  KEY idx_vehicles_status (status),
  CONSTRAINT fk_vehicles_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  CONSTRAINT chk_vehicles_capacity CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NULL,
  nome VARCHAR(120) NOT NULL,
  origem VARCHAR(120) NOT NULL,
  destino VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_routes_driver_id (driver_id),
  KEY idx_routes_created_at (created_at),
  CONSTRAINT fk_routes_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  driver_id INT NULL,
  vehicle_id INT NULL,
  departure_time DATETIME,
  arrival_time DATETIME,
  status ENUM('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  lotacao ENUM('vazio','intermedio','lotado') NOT NULL DEFAULT 'vazio',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_trips_route_id (route_id),
  KEY idx_trips_driver_id (driver_id),
  KEY idx_trips_vehicle_id (vehicle_id),
  KEY idx_trips_status (status),
  KEY idx_trips_departure_time (departure_time),
  CONSTRAINT fk_trips_route FOREIGN KEY (route_id) REFERENCES routes(id),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NULL,
  driver_id INT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_locations_trip_id (trip_id),
  KEY idx_locations_driver_id (driver_id),
  KEY idx_locations_recorded_at (recorded_at),
  CONSTRAINT fk_locations_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT fk_locations_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  CONSTRAINT chk_locations_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_locations_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  role ENUM('passenger','driver') NOT NULL DEFAULT 'passenger',
  type ENUM('reclamacao','sugestao','elogio','problema_operacional') NOT NULL DEFAULT 'sugestao',
  message TEXT NULL,
  passenger_id INT NULL,
  trip_id INT NULL,
  rating TINYINT NULL,
  comment TEXT NULL,
  status ENUM('pending','reviewed','resolved') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_feedback_user_id (user_id),
  KEY idx_feedback_passenger_id (passenger_id),
  KEY idx_feedback_trip_id (trip_id),
  KEY idx_feedback_status (status),
  KEY idx_feedback_created_at (created_at),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_feedback_passenger FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE SET NULL,
  CONSTRAINT fk_feedback_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
  CONSTRAINT chk_feedback_rating CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS ride_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT NOT NULL,
  driver_id INT NOT NULL,
  trip_id INT NOT NULL,
  passenger_latitude DECIMAL(10,8) NOT NULL,
  passenger_longitude DECIMAL(11,8) NOT NULL,
  destination VARCHAR(160) NOT NULL,
  people_count INT NOT NULL DEFAULT 1,
  note TEXT NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_ride_requests_passenger_id (passenger_id),
  KEY idx_ride_requests_driver_id (driver_id),
  KEY idx_ride_requests_trip_id (trip_id),
  KEY idx_ride_requests_status (status),
  KEY idx_ride_requests_created_at (created_at),
  CONSTRAINT fk_ride_requests_passenger FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
  CONSTRAINT fk_ride_requests_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
  CONSTRAINT fk_ride_requests_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  CONSTRAINT chk_ride_requests_people_count CHECK (people_count > 0),
  CONSTRAINT chk_ride_requests_passenger_latitude CHECK (passenger_latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_ride_requests_passenger_longitude CHECK (passenger_longitude BETWEEN -180 AND 180)
);