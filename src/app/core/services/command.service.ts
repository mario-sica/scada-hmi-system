/**
 * @file command.service.ts
 * @description Invio comandi di controllo alle macchine tramite REST API.
 *              Simula la comunicazione verso il PLC via REST endpoint.
 *
 * @production-note
 * In un sistema reale i comandi verrebbero inviati tramite:
 * - OPC-UA Method Call
 * - Modbus Write Register
 * - MQTT publish su topic dedicato
 * Qui usiamo PATCH su /machines/:id + POST su /commands per l'audit trail.
 *
 * RESET/STOP/EMERGENCY_STOP: resettano anche i valori sensore nel db ai valori
 * nominali (temperatura ambiente, rpm=0, pressione=0, vibrazione=0).
 * In un sistema reale questo avverrebbe lato PLC alla ricezione del comando.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, of, forkJoin } from 'rxjs';
import { ControlCommand, CommandType } from '../models/control-command.model';
import { Machine, MachineStatus } from '../models/machine.model';
import { SensorData } from '../models/sensor-data.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

const COMMAND_STATUS_MAP: Record<CommandType, MachineStatus> = {
  START:          'running',
  STOP:           'stopped',
  RESET:          'stopped',
  EMERGENCY_STOP: 'stopped',
};

/** Comandi che mettono la macchina in uno stato fermo → azzerano i sensori nel db */
const STOP_COMMANDS = new Set<CommandType>(['STOP', 'RESET', 'EMERGENCY_STOP']);

/** Valori sensore nominali per una macchina in stato fermo */
const SENSOR_STOPPED: Partial<SensorData> = {
  temperature: 22,   // temperatura ambiente
  pressure:    0,
  rpm:         0,
  vibration:   0,
};

@Injectable({ providedIn: 'root' })
export class CommandService {
  private http = inject(HttpClient);

  /**
   * Invia un comando di controllo alla macchina.
   * Per i comandi STOP/RESET/EMERGENCY_STOP aggiorna anche i valori sensore
   * nel db ai valori nominali di macchina ferma.
   *
   * @param command - Il comando da inviare
   * @returns Observable<void> che completa quando tutte le operazioni sono riuscite
   */
  sendCommand(command: ControlCommand): Observable<void> {
    const timestamped: ControlCommand = { ...command, timestamp: new Date().toISOString() };
    const newStatus = COMMAND_STATUS_MAP[command.command];

    const updateMachine$ = this.http.patch<Machine>(
      API_ENDPOINTS.machine(command.machineId),
      { status: newStatus, lastUpdate: new Date().toISOString() },
    );

    // Se il comando ferma la macchina, resetta anche i sensori nel db
    const updateSensors$ = STOP_COMMANDS.has(command.command)
      ? this.http.get<SensorData[]>(API_ENDPOINTS.sensorByMachine(command.machineId)).pipe(
          switchMap((sensors) => {
            if (!sensors.length) return of(null);
            return this.http.patch<SensorData>(
              `${API_ENDPOINTS.sensors}/${sensors[0].id}`,
              { ...SENSOR_STOPPED, timestamp: new Date().toISOString() },
            );
          }),
        )
      : of(null);

    return forkJoin([updateMachine$, updateSensors$]).pipe(
      switchMap(() => this.http.post<ControlCommand>(API_ENDPOINTS.commands, timestamped)),
      switchMap(() => of(undefined as void)),
    );
  }
}
