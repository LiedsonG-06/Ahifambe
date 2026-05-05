const driverService = require('../services/driverService');

const createDriver = async (req, res) => {
  const { user_id, license_number, phone } = req.body;

  const result = await driverService.createDriver({
    user_id,
    license_number,
    phone,
  });

  res.status(201).json(result);
};

const listDrivers = async (req, res) => {
  const drivers = await driverService.listDrivers();
  res.status(200).json(drivers);
};

module.exports = {
  createDriver,
  listDrivers,
};
