export interface SensorData {
  temperature: number;
  humidity: number;
  moisture: number;
  watering: boolean;
  lastWateredTime: string;
  lastWateringDuration: number;
}

export interface SensorLogRow {
  id?: string;
  device_id: string;
  timestamp: string;
  data: SensorData;
}
