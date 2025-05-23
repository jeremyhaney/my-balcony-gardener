const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // <-- added
dotenv.config();

const sensorRoutes = require("./routes/sensor");
const logsRoutes = require("./routes/logs");
const latestRoutes = require("./routes/latest");
const waterNowRoutes = require("./routes/waterNow");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

app.use("/api/sensor", sensorRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/latest", latestRoutes);
app.use("/api/water-now", waterNowRoutes);

// Catch-all route for React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MBG Backend API running on port ${PORT}`);
});
