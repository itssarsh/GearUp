const express = require("express");
const cors = require("cors");
require("dotenv").config();

const initializeDatabase = require("./init/initDb");
const mechanicUserRoutes = require("./routes/userRoutes");
const mechanicVehicleRoutes = require("./routes/vehicleRoutes");
const mechanicServiceRecordRoutes = require("./routes/serviceRecordRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/mechanic/users", mechanicUserRoutes);
app.use("/api/mechanic/vehicles", mechanicVehicleRoutes);
app.use("/api/mechanic/service-records", mechanicServiceRecordRoutes);

async function startServer() {
  await initializeDatabase();

  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`Mechanic backend running on port ${port}`);
  });
}

startServer();
