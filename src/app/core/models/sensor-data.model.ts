/**
 * @file sensor-data.model.ts
 * @description Modello per i dati telemetrici raccolti dai sensori della macchina.
 *              In produzione questi dati arriverebbero via OPC-UA o Modbus gateway.
 *              Le unità di misura sono standardizzate: °C, bar, rpm, mm/s.
 */

export interface SensorData {
  machineId: string;
  temperature: number;
  pressure: number;
  rpm: number;
  vibration: number;
  timestamp: string;
}
