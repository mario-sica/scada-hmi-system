/**
 * @file command.service.ts
 * @description Invio comandi di controllo alle macchine tramite REST API.
 *
 * Aggiorna i valori sensore nel db in base al comando:
 *  - START             → ripristina i valori nominali operativi della macchina
 *  - STOP/RESET/ESTOP  → azzera i sensori (macchina ferma = temperatura ambiente, tutto a 0)
 *
 * In un sistema reale questo avverrebbe lato PLC/DCS alla ricezione del comando.
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

const STOP_COMMANDS  = new Set<CommandType>(['STOP', 'RESET', 'EMERGENCY_STOP']);
const START_COMMANDS = new Set<CommandType>(['START']);

/** Valori sensore di macchina ferma (temperatura ambiente, tutto a 0) */
const SENSOR_STOPPED: Partial<SensorData> = { temperature: 22, pressure: 0, rpm: 0, vibration: 0 };

/**
 * Valori nominali operativi per macchina (seed per la simulazione).
 * In produzione verrebbero recuperati dalla storica del processo o da un namespace OPC-UA.
 */
const SENSOR_NOMINAL: Record<string, Partial<SensorData>> = {
  M1: { temperature: 72, pressure: 4.2, rpm: 1450, vibration: 0.8 },
  M2: { temperature: 55, pressure: 3.5, rpm: 980,  vibration: 0.6 },
  M3: { temperature: 85, pressure: 5.0, rpm: 890,  vibration: 1.2 },
  M4: { temperature: 55, pressure: 2.5, rpm: 620,  vibration: 1.1 },
};

@Injectable({ providedIn: 'root' })
export class CommandService {
  private http = inject(HttpClient);

  sendCommand(command: ControlCommand): Observable<void> {
    const timestamped: ControlCommand = { ...command, timestamp: new Date().toISOString() };
    const newStatus = COMMAND_STATUS_MAP[command.command];

    const updateMachine$ = this.http.patch<Machine>(
      API_ENDPOINTS.machine(command.machineId),
      { status: newStatus, lastUpdate: new Date().toISOString() },
    );

    const updateSensors$ = this.buildSensorUpdate(command);

    return forkJoin([updateMachine$, updateSensors$]).pipe(
      switchMap(() => this.http.post<ControlCommand>(API_ENDPOINTS.commands, timestamped)),
      switchMap(() => of(undefined as void)),
    );
  }

  private buildSensorUpdate(command: ControlCommand): Observable<SensorData | null> {
    const shouldUpdate = STOP_COMMANDS.has(command.command) || START_COMMANDS.has(command.command);
    if (!shouldUpdate) return of(null);

    const values = STOP_COMMANDS.has(command.command)
      ? SENSOR_STOPPED
      : (SENSOR_NOMINAL[command.machineId] ?? SENSOR_STOPPED);

    return this.http.get<SensorData[]>(API_ENDPOINTS.sensorByMachine(command.machineId)).pipe(
      switchMap((sensors) => {
        if (!sensors.length) return of(null);
        return this.http.patch<SensorData>(
          `${API_ENDPOINTS.sensors}/${sensors[0].id}`,
          { ...values, timestamp: new Date().toISOString() },
        );
      }),
    );
  }
}
