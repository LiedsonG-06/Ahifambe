const { pool } = require('../config/db');

const create = async ({ nome, origem, destino }) => {
  const [result] = await pool.execute(
    'INSERT INTO routes (nome, origem, destino) VALUES (?, ?, ?)',
    [nome, origem, destino]
  );

  return result.insertId;
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, nome, origem, destino, created_at FROM routes WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
};

const findAll = async () => {
  const [rows] = await pool.execute(
    'SELECT id, nome, origem, destino, created_at FROM routes ORDER BY created_at DESC'
  );

  return rows;
};

module.exports = {
  create,
  findById,
  findAll,
};
