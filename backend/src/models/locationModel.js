const { pool } = require('../config/db');

const create = async ({ trip_id, driver_id, latitude, longitude }) => {
  const [result] = await pool.execute(
    'INSERT INTO locations (trip_id, driver_id, latitude, longitude) VALUES (?, ?, ?, ?)',
    [trip_id, driver_id, latitude, longitude]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      trip_id,
      driver_id,
      latitude,
      longitude,
      recorded_at
    FROM locations
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findTripById = async (tripId) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      driver_id,
      status
    FROM trips
    WHERE id = ?
    LIMIT 1`,
    [tripId]
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

const findLatestActiveByDriver = async () => {
  const [rows] = await pool.execute(
    `SELECT
      l.id AS location_id,
      l.latitude,
      l.longitude,
      l.recorded_at,
      t.id AS trip_id,
      t.driver_id,
      t.status,
      t.lotacao,
      r.nome AS route_nome,
      r.origem,
      r.destino,
      v.plate_number,
      v.model
    FROM locations l
    INNER JOIN (
      SELECT
        l2.driver_id,
        MAX(l2.id) AS latest_location_id
      FROM locations l2
      INNER JOIN trips t2 ON t2.id = l2.trip_id
      WHERE t2.status = 'in_progress'
      GROUP BY l2.driver_id
    ) latest ON latest.latest_location_id = l.id
    INNER JOIN trips t ON t.id = l.trip_id
    INNER JOIN routes r ON r.id = t.route_id
    LEFT JOIN vehicles v ON v.id = t.vehicle_id
    WHERE t.status = 'in_progress'
    ORDER BY l.recorded_at DESC`
  );

  return rows;
};

module.exports = {
  create,
  findById,
  findTripById,
  findDriverById,
  findLatestActiveByDriver,
};
