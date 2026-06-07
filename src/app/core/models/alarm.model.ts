/**
 * @file alarm.model.ts
 * @description Modello per gli allarmi generati dal sistema SCADA.
 *              La severity segue la convenzione ISA-18.2: critical (azione immediata),
 *              warning (attenzione richiesta), info (notifica operativa).
 *              Il flag acknowledged distingue allarmi gestiti da quelli ancora attivi.
 */

export type AlarmSeverity = 'critical' | 'warning' | 'info';

export interface Alarm {
  id: string;
  machineId: string;
  message: string;
  severity: AlarmSeverity;
  timestamp: string;
  acknowledged: boolean;
}
