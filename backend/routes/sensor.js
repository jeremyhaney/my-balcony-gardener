const express = require("express");
const router = express.Router();
const { supabase } = require("../services/supabaseClient");
const validateSensorData = require("../utils/validateSensorData");

router.post("/", async (req, res) => {
  const data = req.body;

  if (!validateSensorData(data)) {
    return res.status(400).json({ error: "Invalid sensor data" });
  }

  const { error } = await supabase.from("sensor_logs").insert([{ data }]);
  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: "Data logged successfully" });
});

module.exports = router;
