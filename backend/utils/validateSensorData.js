module.exports = function validateSensorData(payload) {
  const data = payload.data;
  if (
    !data ||
    typeof data.temperature !== "number" ||
    typeof data.humidity !== "number" ||
    typeof data.watering !== "boolean"
  ) return false;

  return true;
};