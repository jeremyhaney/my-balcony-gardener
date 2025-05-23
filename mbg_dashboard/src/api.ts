export async function fetchLogs() {
  const response = await fetch("http://10.0.0.192/logs");
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
}
