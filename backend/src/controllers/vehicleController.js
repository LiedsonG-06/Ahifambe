const vehicleService = require('../services/vehicleService');

const createVehicle = async (req, res) => {
  const { driver_id, plate_number, model, capacity } = req.body;
  const vehicleInput = {
    plate_number,
    model,
    capacity,
    user: req.user,
  };

  if (Object.prototype.hasOwnProperty.call(req.body, 'driver_id')) {
    vehicleInput.driver_id = driver_id;
  }

  const result = await vehicleService.createVehicle(vehicleInput);

  res.status(201).json(result);
};

const listVehicles = async (req, res) => {
  const vehicles = await vehicleService.listVehicles(req.user);
  res.status(200).json(vehicles);
};

module.exports = {
  createVehicle,
  listVehicles,
};
