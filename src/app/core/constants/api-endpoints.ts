/**
 * @file api-endpoints.ts
 * @description URL delle API REST (JSON Server mock su porta 3000).
 */

export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  machines: `${API_BASE_URL}/machines`,
  machine: (id: string) => `${API_BASE_URL}/machines/${id}`,
  sensors: `${API_BASE_URL}/sensors`,
  sensorByMachine: (machineId: string) => `${API_BASE_URL}/sensors?machineId=${machineId}`,
  alarms: `${API_BASE_URL}/alarms`,
  alarmsByMachine: (machineId: string) => `${API_BASE_URL}/alarms?machineId=${machineId}`,
  activeAlarms: `${API_BASE_URL}/alarms?acknowledged=false`,
  alarm: (id: string) => `${API_BASE_URL}/alarms/${id}`,
  commands: `${API_BASE_URL}/commands`,
} as const;
