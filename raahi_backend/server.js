const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const connectDB = require("./config/db");
const busRoutes=require("./routes/busRoutes")
const sosRoutes=require("./routes/sosRoutes");
const locationRoutes=require("./routes/locationRoutes");
const routeRoutes=require("./routes/routeRoutes");
const reportRoutes=require("./routes/reportRoutes");
const driverRoutes=require("./routes/driverRoutes");
const authRoutes=require("./routes/auth");
const organizationRoutes=require("./routes/organizationRoutes");
const cityPassengerRoutes=require("./routes/cityPassengerRoutes");
const superAdminStopRoutes=require("./routes/superAdminStopRoutes");
const superAdminCityRouteRoutes=require("./routes/superAdminCityRouteRoutes");
const { organizationContext } = require("./middleware/organizationContext");
const app = express();
const cors=require('cors');
const passengerRoutes=require("./routes/passengerRoutes")

app.use(cors());
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(organizationContext);



app.use("/api/organizations",organizationRoutes);
app.use("/api/super-admin/stops",superAdminStopRoutes);
app.use("/api/super-admin/city-routes",superAdminCityRouteRoutes);
app.use("/api/buses",busRoutes)
app.use('/api/sos',sosRoutes);
app.use("/api/location",locationRoutes);
app.use("/api/routes",routeRoutes);
app.use("/api/reports",reportRoutes);
app.use("/api/drivers",driverRoutes);
app.use('/api/auth',authRoutes);
app.use("/api/passengers",passengerRoutes);
app.use("/api/city",cityPassengerRoutes);
connectDB();


app.get("/", (req, res) => {
    res.send("Raahi Backend with DB Running 🚍");
});




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

