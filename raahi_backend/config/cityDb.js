const mongoose = require("mongoose");

let cityConnection = null;

const getCityDbConnection = () => {
  if (cityConnection) return cityConnection;

  const uri = process.env.CITY_MONGO_URI || process.env.MONGO_URI;
  const dbName = process.env.CITY_DB_NAME || "raahi_city_admin";

  cityConnection = mongoose.createConnection(uri, { dbName });

  cityConnection.on("connected", () => {
    console.log(`City admin MongoDB connected (${dbName})`);
  });

  cityConnection.on("error", (error) => {
    console.error("City admin MongoDB connection failed:", error.message);
  });

  return cityConnection;
};

module.exports = { getCityDbConnection };
