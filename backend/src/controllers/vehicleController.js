const vehicleService = require('../services/vehicleService');

const createVehicle = async (req, res) => {
  const { driver_id, plate_number, model, capacity } = req.body;

  const result = await vehicleService.createVehicle({
    driver_id,
    plate_number,
    model,
    capacity,
  });

  res.status(201).json(result);
};

const listVehicles = async (req, res) => {
  const vehicles = await vehicleService.listVehicles();
  res.status(200).json(vehicles);
};

module.exports = {
  createVehicle,
  listVehicles,
};
