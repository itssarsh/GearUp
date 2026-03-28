const express = require("express");
const auth = require("../middleware/auth");
const mechanicVehicleController = require("../controllers/vehicleController");

const router = express.Router();

router.get("/", auth, mechanicVehicleController.listVehicles);
router.post("/", auth, mechanicVehicleController.createVehicle);

module.exports = router;
