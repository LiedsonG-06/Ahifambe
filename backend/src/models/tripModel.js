const { pool } = require('../config/db');

const create = async ({ route_id, driver_id, vehicle_id }) => {
  const [result] = await pool.execute(
    "INSERT INTO trips (route_id, driver_id, vehicle_id, departure_time, status) VALUES (?, ?, ?, NOW(), 'in_progress')",
    [route_id, driver_id, vehicle_id]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      route_id,
      driver_id,
      vehicle_id,
      departure_time,
      arrival_time,
      status,
      created_at,
      updated_at
    FROM trips
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findRouteById = async (routeId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM routes WHERE id = ? LIMIT 1',
    [routeId]
  );

  return rows[0] || null;
};

const findDriverById = async (driverId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM drivers WHERE id = ? LIMIT 1',
    [driverId]
  );

  return rows[0] || null;
};

const findVehicleById = async (vehicleId) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id FROM vehicles WHERE id = ? LIMIT 1',
    [vehicleId]
  );

  return rows[0] || null;
};

const findInProgressByDriverId = async (driverId) => {
  const [rows] = await pool.execute(
    "SELECT id FROM trips WHERE driver_id = ? AND status = 'in_progress' LIMIT 1",
    [driverId]
  );

  return rows[0] || null;
};

const complete = async (id) => {
  await pool.execute(
    "UPDATE trips SET status = 'completed', arrival_time = NOW() WHERE id = ?",
    [id]
  );
};

const findActive = async () => {
  const [rows] = await pool.execute(
    `SELECT
      t.id,
      t.status,
      t.departure_time,
      r.nome AS route_nome,
      r.origem,
      r.destino,
      u.name AS driver_name,
      u.email AS driver_email,
      v.plate_number,
      v.model,
      v.capacity
    FROM trips t
    INNER JOIN routes r ON r.id = t.route_id
    INNER JOIN drivers d ON d.id = t.driver_id
    INNER JOIN users u ON u.id = d.user_id
    INNER JOIN vehicles v ON v.id = t.vehicle_id
    WHERE t.status = 'in_progress'
    ORDER BY t.departure_time DESC`
  );

  return rows;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT
      t.id,
      t.route_id,
      t.driver_id,
      t.vehicle_id,
      t.departure_time,
      t.arrival_time,
      t.status,
      t.created_at,
      t.updated_at,
      r.nome AS route_nome,
      r.origem,
      r.destino,
      u.name AS driver_name,
      u.email AS driver_email,
      v.plate_number,
      v.model,
      v.capacity
    FROM trips t
    INNER JOIN routes r ON r.id = t.route_id
    LEFT JOIN drivers d ON d.id = t.driver_id
    LEFT JOIN users u ON u.id = d.user_id
    LEFT JOIN vehicles v ON v.id = t.vehicle_id
    ORDER BY t.created_at DESC`
  );

  return rows;
};

module.exports = {
  create,
  findById,
  findRouteById,
  findDriverById,
  findVehicleById,
  findInProgressByDriverId,
  complete,
  findActive,
  findAll,
};
