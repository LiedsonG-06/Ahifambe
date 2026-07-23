const { pool } = require('../config/db');

const createForUser = async (userId, connection = pool) => {
  const [result] = await connection.execute(
    'INSERT INTO drivers (user_id, status) VALUES (?, \'active\')',
    [userId]
  );

  return result.insertId;
};

const create = async ({ user_id, license_number, phone }) => {
  const [result] = await pool.execute(
    'INSERT INTO drivers (user_id, license_number, phone, status) VALUES (?, ?, ?, \'active\')',
    [user_id, license_number, phone]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT
      d.id,
      d.user_id,
      u.name,
      u.email,
      d.license_number,
      d.phone,
      d.status,
      d.created_at
    FROM drivers d
    INNER JOIN users u ON u.id = d.user_id
    WHERE d.id = ?
    LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findByUserId = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT id, user_id, status FROM drivers WHERE user_id = ? LIMIT 1',
    [userId]
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT
      d.id,
      d.user_id,
      u.name,
      u.email,
      d.license_number,
      d.phone,
      d.status,
      d.created_at
    FROM drivers d
    INNER JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC`
  );

  return rows;
};

module.exports = {
  createForUser,
  create,
  findById,
  findByUserId,
  findAll,
};
