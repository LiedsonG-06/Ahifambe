const { pool } = require('../config/db');

const create = async ({ driver_id, nome, origem, destino }) => {
  const [result] = await pool.execute(
    'INSERT INTO routes (driver_id, nome, origem, destino) VALUES (?, ?, ?, ?)',
    [driver_id, nome, origem, destino]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, nome, origem, destino, created_at FROM routes WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, nome, origem, destino, created_at FROM routes ORDER BY created_at DESC'
  );

  return rows;
};

const findByDriverId = async (driverId) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, nome, origem, destino, created_at FROM routes WHERE driver_id = ? ORDER BY created_at DESC',
    [driverId]
  );

  return rows;
};

module.exports = {
  create,
  findById,
  findAll,
  findByDriverId,
};
