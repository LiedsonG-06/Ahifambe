const { pool } = require('../config/db');

const create = async ({ user_id, role, type, message, trip_id, passenger_id = null, rating = null, comment = null }) => {
  const [result] = await pool.execute(
    `INSERT INTO feedback
      (user_id, role, type, message, trip_id, passenger_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, role, type, message, trip_id || null, passenger_id, rating, comment]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      id,
      user_id,
      role,
      type,
      message,
      passenger_id,
      trip_id,
      rating,
      comment,
      status,
      created_at
    FROM feedback
    WHERE id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findPassengerById = async (passengerId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM passengers WHERE id = ? LIMIT 1',
    [passengerId]
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

const findTripById = async (tripId) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, status FROM trips WHERE id = ? LIMIT 1',
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

const findByPassengerAndTrip = async (passengerId, tripId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM feedback WHERE passenger_id = ? AND trip_id = ? AND rating IS NOT NULL LIMIT 1',
    [passengerId, tripId]
  );

  return rows[0] || null;
};

const findUserById = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, role FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT
      f.id,
      f.user_id,
      f.role,
      f.type,
      f.message,
      f.status,
      f.rating,
      f.comment,
      f.created_at,
      u.name AS sender_name,
      u.email AS sender_email,
      p.id AS passenger_id,
      pu.name AS passenger_name,
      pu.email AS passenger_email,
      t.id AS trip_id,
      d.id AS driver_id,
      du.name AS driver_name,
      du.email AS driver_email,
      r.nome AS route_nome,
      r.origem AS route_origem,
      r.destino AS route_destino
    FROM feedback f
    LEFT JOIN users u ON u.id = f.user_id
    LEFT JOIN passengers p ON p.id = f.passenger_id
    LEFT JOIN users pu ON pu.id = p.user_id
    LEFT JOIN trips t ON t.id = f.trip_id
    LEFT JOIN drivers d ON d.id = t.driver_id
    LEFT JOIN users du ON du.id = d.user_id
    LEFT JOIN routes r ON r.id = t.route_id
    ORDER BY f.created_at DESC`
  );

  return rows;
};

const updateStatus = async (id, status) => {
  const [result] = await pool.execute(
    'UPDATE feedback SET status = ? WHERE id = ?',
    [status, id]
  );

  return result.affectedRows;
};

const findByDriverId = async (driverId) => {
  const [rows] = await pool.execute(
    `SELECT
      f.id,
      f.rating,
      f.comment,
      f.created_at,
      p.id AS passenger_id,
      pu.name AS passenger_name,
      pu.email AS passenger_email,
      t.id AS trip_id,
      r.nome AS route_nome,
      r.origem AS route_origem,
      r.destino AS route_destino
    FROM feedback f
    INNER JOIN passengers p ON p.id = f.passenger_id
    INNER JOIN users pu ON pu.id = p.user_id
    INNER JOIN trips t ON t.id = f.trip_id
    INNER JOIN routes r ON r.id = t.route_id
    WHERE t.driver_id = ? AND f.rating IS NOT NULL
    ORDER BY f.created_at DESC`,
    [driverId]
  );

  return rows;
};

const getDriverFeedbackSummary = async (driverId) => {
  const [rows] = await pool.execute(
    `SELECT
      AVG(f.rating) AS average_rating,
      COUNT(f.id) AS total_feedbacks
    FROM feedback f
    INNER JOIN trips t ON t.id = f.trip_id
    WHERE t.driver_id = ? AND f.rating IS NOT NULL`,
    [driverId]
  );

  return rows[0] || { average_rating: null, total_feedbacks: 0 };
};

module.exports = {
  create,
  findById,
  findPassengerById,
  findPassengerByUserId,
  findTripById,
  findDriverById,
  findByPassengerAndTrip,
  findUserById,
  findAll,
  updateStatus,
  findByDriverId,
  getDriverFeedbackSummary,
};
