const express = require("express");
const router = express.Router();
const { supabase } = require("../services/supabaseClient");

router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("sensor_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
