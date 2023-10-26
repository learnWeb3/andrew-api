export interface IAclReportDocument {
  data_to_vehicle: {
    name: 'data';
    parent: string;
  };
  vehicle: string;
  device: string;
  timestamp: number;
  obd_data: {
    fuel_rate: number;
    vehicle_speed: number;
    engine_speed: number;
    relative_accel_pos: number;
  };
}
