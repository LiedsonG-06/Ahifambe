const locationService = require('../services/locationService');

const updateLocation = async (req, res) => {
  const { trip_id, driver_id, latitude, longitude } = req.body;

  const result = await locationService.updateLocation({
    trip_id,
    driver_id,
    latitude,
    longitude,
  });

  res.status(201).json(result);
};

const listActiveLocations = async (req, res) => {
  const locations = await locationService.listActiveLocations();
  res.status(200).json(locations);
};

module.exports = {
  updateLocation,
  listActiveLocations,
};
