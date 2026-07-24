const { pool } = require('../config/db');

const createWithRouteAssignment = async ({ route_id, driver_id, vehicle_id }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('SELECT id FROM drivers WHERE id = ? FOR UPDATE', [driver_id]);
    const [activeTrips] = await connection.execute("SELECT id FROM trips WHERE driver_id = ? AND status = 'in_progress' LIMIT 1", [driver_id]);
    if (activeTrips.length) { const error = new Error('Driver already has a trip in progress.'); error.code = 'ACTIVE_TRIP_EXISTS'; throw error; }
    const [routes] = await connection.execute('SELECT id, driver_id FROM routes WHERE id = ? FOR UPDATE', [route_id]);
    const route = routes[0];
    if (!route) { const error = new Error('Route not found.'); error.code = 'ROUTE_NOT_FOUND'; throw error; }
    if (route.driver_id !== null && Number(route.driver_id) !== Number(driver_id)) { const error = new Error('Route has already been assigned to another driver.'); error.code = 'ROUTE_ALREADY_ASSIGNED'; throw error; }
    if (route.driver_id === null) {
      const [assignment] = await connection.execute('UPDATE routes SET driver_id = ? WHERE id = ? AND driver_id IS NULL', [driver_id, route_id]);
      if (assignment.affectedRows !== 1) { const error = new Error('Route has already been assigned to another driver.'); error.code = 'ROUTE_ALREADY_ASSIGNED'; throw error; }
    }
    const [result] = await connection.execute("INSERT INTO trips (route_id, driver_id, vehicle_id, departure_time, status) VALUES (?, ?, ?, NOW(), 'in_progress')", [route_id, driver_id, vehicle_id]);
    await connection.commit();
    return result.insertId;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
};

const tripDetailsSelect = `SELECT t.id, t.route_id, t.driver_id, t.vehicle_id, t.departure_time,
  t.arrival_time, t.status, t.lotacao, t.created_at, t.updated_at,
  r.nome AS route_nome, r.origem, r.destino,
  u.name AS driver_name, v.plate_number, v.model, v.capacity,
  l.latitude AS latest_latitude, l.longitude AS latest_longitude, l.recorded_at AS latest_location_at
FROM trips t
INNER JOIN routes r ON r.id = t.route_id
LEFT JOIN drivers d ON d.id = t.driver_id
LEFT JOIN users u ON u.id = d.user_id
LEFT JOIN vehicles v ON v.id = t.vehicle_id
LEFT JOIN locations l ON l.id = (SELECT l2.id FROM locations l2 WHERE l2.trip_id = t.id ORDER BY l2.recorded_at DESC, l2.id DESC LIMIT 1)`;

const findById = async (id) => {
  const [rows] = await pool.execute(`${tripDetailsSelect} WHERE t.id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};
const findRouteById = async (routeId) => { const [rows] = await pool.execute('SELECT id, driver_id FROM routes WHERE id = ? LIMIT 1', [routeId]); return rows[0] || null; };
const findVehicleById = async (vehicleId) => { const [rows] = await pool.execute('SELECT id, driver_id, status FROM vehicles WHERE id = ? LIMIT 1', [vehicleId]); return rows[0] || null; };
const findActiveDetailsByDriverId = async (driverId) => { const [rows] = await pool.execute(`${tripDetailsSelect} WHERE t.driver_id = ? AND t.status = 'in_progress' ORDER BY t.departure_time DESC LIMIT 1`, [driverId]); return rows[0] || null; };
const complete = async (id) => { const [result] = await pool.execute("UPDATE trips SET status = 'finished', arrival_time = NOW() WHERE id = ? AND status = 'in_progress'", [id]); return result.affectedRows; };
const updateLotacao = async (id, lotacao) => { const [result] = await pool.execute("UPDATE trips SET lotacao = ? WHERE id = ? AND status = 'in_progress'", [lotacao, id]); return result.affectedRows; };

const buildFilters = ({ status, driver_id, route_id, vehicle_id, date_from, date_to, search }) => {
  const clauses = [], values = [];
  if (status) { clauses.push('t.status = ?'); values.push(status); }
  if (driver_id) { clauses.push('t.driver_id = ?'); values.push(driver_id); }
  if (route_id) { clauses.push('t.route_id = ?'); values.push(route_id); }
  if (vehicle_id) { clauses.push('t.vehicle_id = ?'); values.push(vehicle_id); }
  if (date_from) { clauses.push('t.departure_time >= ?'); values.push(`${date_from} 00:00:00`); }
  if (date_to) { clauses.push('t.departure_time < DATE_ADD(?, INTERVAL 1 DAY)'); values.push(date_to); }
  if (search) { clauses.push('(v.plate_number LIKE ? OR u.name LIKE ? OR r.nome LIKE ?)'); const term=`%${search}%`; values.push(term, term, term); }
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
};
const findAll = async (filters) => {
  const { where, values } = buildFilters(filters);
  const [rows] = await pool.execute(`${tripDetailsSelect}${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`, [...values, filters.limit, filters.offset]);
  return rows;
};
const countAll = async (filters) => {
  const { where, values } = buildFilters(filters);
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM trips t INNER JOIN routes r ON r.id=t.route_id LEFT JOIN drivers d ON d.id=t.driver_id LEFT JOIN users u ON u.id=d.user_id LEFT JOIN vehicles v ON v.id=t.vehicle_id${where}`, values);
  return Number(rows[0].total);
};
const findActive = async () => { const [rows] = await pool.execute(`${tripDetailsSelect} WHERE t.status = 'in_progress' ORDER BY t.departure_time DESC`); return rows; };

module.exports = { createWithRouteAssignment, findById, findRouteById, findVehicleById, findActiveDetailsByDriverId, complete, updateLotacao, findActive, findAll, countAll };