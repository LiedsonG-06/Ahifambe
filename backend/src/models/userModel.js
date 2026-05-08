const { pool } = require('../config/db');
const env = require('../config/env');

const create = async ({ name, email, passwordHash, role }, connection = pool) => {
  const [result] = await connection.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );

  return result.insertId;
};

const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
};

const hasStatusColumn = async () => {
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'status'
    LIMIT 1`,
    [env.db.database]
  );

  return rows.length > 0;
};

const findAllForAdmin = async () => {
  const hasStatus = await hasStatusColumn();
  const columns = hasStatus
    ? 'id, name, email, role, status, created_at, updated_at'
    : 'id, name, email, role, created_at, updated_at';

  const [rows] = await pool.execute(
    `SELECT ${columns} FROM users ORDER BY created_at DESC`
  );

  return rows;
};

const updateStatus = async (id, status) => {
  const [result] = await pool.execute(
    'UPDATE users SET status = ? WHERE id = ?',
    [status, id]
  );

  return result.affectedRows;
};

const deleteById = async (id) => {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE id = ?',
    [id]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findByEmail,
  findById,
  hasStatusColumn,
  findAllForAdmin,
  updateStatus,
  deleteById,
};
