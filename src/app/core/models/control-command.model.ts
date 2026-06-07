/**
 * @file control-command.model.ts
 * @description Modello per i comandi di controllo inviati alle macchine.
 *              operatorId serve per l'audit trail — in produzione sarebbe l'ID
 *              dell'operatore autenticato sul sistema MES/SCADA.
 *              EMERGENCY_STOP bypassa la logica standard e invia un segnale diretto al PLC.
 */

export type CommandType = 'START' | 'STOP' | 'RESET' | 'EMERGENCY_STOP';

export interface ControlCommand {
  machineId: string;
  command: CommandType;
  operatorId: string;
  timestamp: string;
}
