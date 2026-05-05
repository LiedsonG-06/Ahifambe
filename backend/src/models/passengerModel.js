const { pool } = require('../config/db');

const createForUser = async (userId, connection = pool) => {
  const [result] = await connection.execute(
    'INSERT INTO passengers (user_id) VALUES (?)',
    [userId]
  );

  return result.insertId;
};

module.exports = {
  createForUser,
};
