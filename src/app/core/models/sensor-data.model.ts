/**
 * @file sensor-data.model.ts
 * @description Modello per i dati telemetrici raccolti dai sensori della macchina.
 *              In produzione questi dati arriverebbero via OPC-UA o Modbus gateway.
 *              Le unità di misura sono standardizzate: °C, bar, rpm, mm/s.
 */

export interface SensorData {
  id: string;            // assegnato da JSON Server (es. "s1")
  machineId: string;
  temperature: number;   // °C
  pressure: number;      // bar
  rpm: number;           // giri/min
  vibration: number;     // mm/s
  timestamp: string;     // ISO 8601
}
