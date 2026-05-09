const { pool } = require('../config/db');

const create = async ({
  passenger_id,
  driver_id,
  trip_id,
  passenger_latitude,
  passenger_longitude,
  destination,
  people_count,
  note,
}) => {
  const [result] = await pool.execute(
    `INSERT INTO ride_requests (
      passenger_id,
      driver_id,
      trip_id,
      passenger_latitude,
      passenger_longitude,
      destination,
      people_count,
      note,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      passenger_id,
      driver_id,
      trip_id,
      passenger_latitude,
      passenger_longitude,
      destination,
      people_count,
      note || null,
    ]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      passenger_id,
      driver_id,
      trip_id,
      passenger_latitude,
      passenger_longitude,
      destination,
      people_count,
      note,
      status,
      created_at
    FROM ride_requests
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findTripById = async (tripId) => {
  const [rows] = await pool.execute(
    `SELECT id, driver_id, status
    FROM trips
    WHERE id = ?
    LIMIT 1`,
    [tripId]
  );

  return rows[0] || null;
};

const findPassengerByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id FROM passengers WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

const findDriverByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id FROM drivers WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

const findForDriver = async (driverId) => {
  const [rows] = await pool.execute(
    `SELECT
      rr.id,
      u.name AS passenger_name,
      u.email AS passenger_email,
      rr.passenger_latitude,
      rr.passenger_longitude,
      rr.destination,
      rr.people_count,
      rr.note,
      rr.status,
      rr.trip_id,
      rr.created_at
    FROM ride_requests rr
    INNER JOIN passengers p ON p.id = rr.passenger_id
    INNER JOIN users u ON u.id = p.user_id
    WHERE rr.driver_id = ?
      AND rr.status IN ('pending', 'accepted')
    ORDER BY rr.created_at DESC`,
    [driverId]
  );

  return rows;
};

const findForPassenger = async (passengerId) => {
  const [rows] = await pool.execute(
    `SELECT
      rr.id,
      rr.driver_id,
      du.name AS driver_name,
      du.email AS driver_email,
      rr.passenger_latitude,
      rr.passenger_longitude,
      rr.destination,
      rr.people_count,
      rr.note,
      rr.status,
      rr.trip_id,
      rr.created_at
    FROM ride_requests rr
    INNER JOIN drivers d ON d.id = rr.driver_id
    INNER JOIN users du ON du.id = d.user_id
    WHERE rr.passenger_id = ?
    ORDER BY rr.created_at DESC`,
    [passengerId]
  );

  return rows;
};

const updateStatus = async (id, status) => {
  await pool.execute(
    'UPDATE ride_requests SET status = ? WHERE id = ?',
    [status, id]
  );
};

module.exports = {
  create,
  findById,
  findTripById,
  findPassengerByUserId,
  findDriverByUserId,
  findForDriver,
  findForPassenger,
  updateStatus,
};
