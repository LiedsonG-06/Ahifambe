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
    `SELECT id, driver_id, nome, origem, destino, created_at
    FROM routes
    WHERE driver_id = ? OR driver_id IS NULL
    ORDER BY driver_id IS NULL, created_at DESC`,
    [driverId]
  );

  return rows;
};

const assignToDriverIfUnassigned = async (id, driverId) => {
  const [result] = await pool.execute(
    'UPDATE routes SET driver_id = ? WHERE id = ? AND driver_id IS NULL',
    [driverId, id]
  );

  return result.affectedRows;
};

const update = async (id, { driver_id, nome, origem, destino }) => {
  const [result] = await pool.execute(
    'UPDATE routes SET driver_id = ?, nome = ?, origem = ?, destino = ? WHERE id = ?',
    [driver_id, nome, origem, destino, id]
  );

  return result.affectedRows;
};

const hasInProgressTrip = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id FROM trips WHERE route_id = ? AND status = 'in_progress' LIMIT 1",
    [id]
  );

  return rows.length > 0;
};

const remove = async (id) => {
  const [result] = await pool.execute('DELETE FROM routes WHERE id = ?', [id]);

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findAll,
  findByDriverId,
  assignToDriverIfUnassigned,
  update,
  hasInProgressTrip,
  remove,
};
