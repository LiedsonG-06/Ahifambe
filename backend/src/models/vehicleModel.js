const { pool } = require('../config/db');

const create = async ({ driver_id, plate_number, model, capacity, status }) => {
  const [result] = await pool.execute(
    'INSERT INTO vehicles (driver_id, plate_number, model, capacity, status) VALUES (?, ?, ?, ?, ?)',
    [driver_id, plate_number, model, capacity, status]
  );
  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.driver_id, v.plate_number, v.model, v.capacity, v.status, v.created_at, v.updated_at,
      EXISTS(SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'in_progress') AS has_active_trip
    FROM vehicles v WHERE v.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const findByPlateNumber = async (plateNumber, excludeId = null) => {
  const sql = excludeId
    ? 'SELECT id, plate_number FROM vehicles WHERE plate_number = ? AND id <> ? LIMIT 1'
    : 'SELECT id, plate_number FROM vehicles WHERE plate_number = ? LIMIT 1';
  const [rows] = await pool.execute(sql, excludeId ? [plateNumber, excludeId] : [plateNumber]);
  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    `SELECT v.id, v.driver_id, v.plate_number, v.model, v.capacity, v.status, v.created_at, v.updated_at,
      EXISTS(SELECT 1 FROM trips t WHERE t.vehicle_id = v.id AND t.status = 'in_progress') AS has_active_trip
    FROM vehicles v ORDER BY v.created_at DESC`
  );
  return rows;
};

const findByDriverId = async (driverId) => {
  const [rows] = await pool.execute(
    'SELECT id, driver_id, plate_number, model, capacity, status, created_at, updated_at FROM vehicles WHERE driver_id = ? ORDER BY created_at DESC',
    [driverId]
  );
  return rows;
};

const hasInProgressTrip = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id FROM trips WHERE vehicle_id = ? AND status = 'in_progress' LIMIT 1",
    [id]
  );
  return rows.length > 0;
};

const hasAnyTrip = async (id) => {
  const [rows] = await pool.execute('SELECT id FROM trips WHERE vehicle_id = ? LIMIT 1', [id]);
  return rows.length > 0;
};

const update = async (id, { driver_id, plate_number, model, capacity, status }) => {
  const [result] = await pool.execute(
    'UPDATE vehicles SET driver_id = ?, plate_number = ?, model = ?, capacity = ?, status = ? WHERE id = ?',
    [driver_id, plate_number, model, capacity, status, id]
  );
  return result.affectedRows;
};

const updateStatus = async (id, status) => {
  const [result] = await pool.execute('UPDATE vehicles SET status = ? WHERE id = ?', [status, id]);
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);
  return result.affectedRows;
};

module.exports = { create, findById, findByPlateNumber, findAll, findByDriverId, hasInProgressTrip, hasAnyTrip, update, updateStatus, remove };