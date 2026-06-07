/**
 * @file machine.model.ts
 * @description Modello dati per le macchine industriali monitorate dal sistema SCADA.
 *              MachineStatus rispecchia gli stati tipici di un ciclo di vita PLC:
 *              running (in produzione), stopped (fermo controllato), fault (errore),
 *              maintenance (fuori servizio per manutenzione programmata).
 */

export type MachineStatus = 'running' | 'stopped' | 'fault' | 'maintenance';

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  lastUpdate: string;
}
