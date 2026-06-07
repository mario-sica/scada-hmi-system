/**
 * @file thresholds.ts
 * @description Soglie di allarme per i sensori delle macchine.
 *              I valori rispecchiano limiti operativi tipici per impianti industriali generici.
 *              In produzione questi potrebbero essere configurabili per macchina tramite
 *              un servizio di configurazione centralizzato (es. da PLC engineering tool).
 */

export const SENSOR_THRESHOLDS = {
  temperature: { warning: 80, critical: 95 },
  pressure: { warning: 5.0, critical: 7.0 },
  rpm: { warning: 1600, critical: 1800 },
  vibration: { warning: 2.0, critical: 4.0 },
} as const;

export type SensorKey = keyof typeof SENSOR_THRESHOLDS;
export type ThresholdLevel = 'normal' | 'warning' | 'critical';

export function getSensorThresholdLevel(sensor: SensorKey, value: number): ThresholdLevel {
  const thresholds = SENSOR_THRESHOLDS[sensor];
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'normal';
}
