const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  console.log("Manual watering triggered");
  res.status(200).json({ message: "Watering command received" });
});

module.exports = router;
