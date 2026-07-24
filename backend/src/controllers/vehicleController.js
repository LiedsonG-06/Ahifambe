const vehicleService = require('../services/vehicleService');
const createVehicle = async (req, res) => res.status(201).json(await vehicleService.createVehicle(req.body));
const listVehicles = async (req, res) => res.status(200).json(await vehicleService.listVehicles(req.user));
const updateVehicle = async (req, res) => res.status(200).json(await vehicleService.updateVehicle(req.params.id, req.body));
const updateVehicleStatus = async (req, res) => res.status(200).json(await vehicleService.updateVehicleStatus({ vehicleId: req.params.id, status: req.body.status }));
const deleteVehicle = async (req, res) => res.status(200).json(await vehicleService.deleteVehicle(req.params.id));
module.exports = { createVehicle, listVehicles, updateVehicle, updateVehicleStatus, deleteVehicle };