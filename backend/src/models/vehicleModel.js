const { pool } = require('../config/db');

const create = async ({ driver_id, plate_number, model, capacity }) => {
  if (driver_id) {
    const [result] = await pool.execute(
      'INSERT INTO vehicles (driver_id, plate_number, model, capacity, status) VALUES (?, ?, ?, ?, \'active\')',
      [driver_id, plate_number, model, capacity]
    );

    return result.insertId;
  }

  const [result] = await pool.execute(
    'INSERT INTO vehicles (plate_number, model, capacity, status) VALUES (?, ?, ?, \'active\')',
    [plate_number, model, capacity]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, plate_number, model, capacity, status, created_at, updated_at FROM vehicles WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
};

const findByPlateNumber = async (plateNumber) => {
  const [rows] = await pool.execute(
    'SELECT id, plate_number FROM vehicles WHERE plate_number = ? LIMIT 1',
    [plateNumber]
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT id, plate_number, model, capacity, status, created_at FROM vehicles ORDER BY created_at DESC'
  );

  return rows;
};

const findByDriverId = async (driverId) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, plate_number, model, capacity, status, created_at FROM vehicles WHERE driver_id = ? ORDER BY created_at DESC',
    [driverId]
  );

  return rows;
};

const updateStatus = async (id, status) => {
  const [result] = await pool.execute(
    'UPDATE vehicles SET status = ? WHERE id = ?',
    [status, id]
  );

  return result.affectedRows;
};

module.exports = {
  create,
  findById,
  findByPlateNumber,
  findAll,
  findByDriverId,
  updateStatus,
};
