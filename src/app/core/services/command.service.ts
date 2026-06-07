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
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { ControlCommand, CommandType } from '../models/control-command.model';
import { Machine, MachineStatus } from '../models/machine.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

const COMMAND_STATUS_MAP: Record<CommandType, MachineStatus> = {
  START: 'running',
  STOP: 'stopped',
  RESET: 'stopped',
  EMERGENCY_STOP: 'stopped',
};

@Injectable({ providedIn: 'root' })
export class CommandService {
  private http = inject(HttpClient);

  /**
   * Invia un comando di controllo alla macchina.
   * Prima aggiorna lo stato macchina (PATCH), poi registra il comando per audit trail (POST).
   *
   * @param command - Il comando da inviare con machineId, tipo, operatorId
   * @returns Observable<void> che completa quando entrambe le operazioni sono riuscite
   */
  sendCommand(command: ControlCommand): Observable<void> {
    const commandWithTimestamp: ControlCommand = {
      ...command,
      timestamp: new Date().toISOString(),
    };

    const newStatus = COMMAND_STATUS_MAP[command.command];

    return this.http
      .patch<Machine>(API_ENDPOINTS.machine(command.machineId), {
        status: newStatus,
        lastUpdate: new Date().toISOString(),
      })
      .pipe(
        switchMap(() =>
          this.http.post<ControlCommand>(API_ENDPOINTS.commands, commandWithTimestamp)
        ),
        switchMap(() => new Observable<void>((obs) => { obs.next(); obs.complete(); }))
      );
  }
}
