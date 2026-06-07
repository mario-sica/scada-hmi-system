/**
 * @file machine.service.ts
 * @description Servizio per il recupero e l'aggiornamento dei dati macchina
 *              tramite REST API (JSON Server mock). In produzione questo servizio
 *              comunicherebbe con un OPC-UA gateway o un middleware industriale.
 *
 * @architecture
 * Angular Service (providedIn: 'root') → HttpClient → JSON Server (porta 3000)
 * Il polling real-time è implementato con RxJS interval + switchMap per simulare
 * il ciclo di scansione tipico di un sistema SCADA (scan cycle 5s).
 *
 * @production-note
 * In un sistema reale, i dati arriverebbero tramite:
 * - WebSocket (per dati ad alta frequenza)
 * - REST polling (per stati macchina, meno frequente)
 * - OPC-UA client → REST gateway → Angular
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, map } from 'rxjs';
import { Machine, MachineStatus } from '../models/machine.model';
import { SensorData } from '../models/sensor-data.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { SensorSimulatorService } from './sensor-simulator.service';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private http      = inject(HttpClient);
  private simulator = inject(SensorSimulatorService);

  getMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(API_ENDPOINTS.machines);
  }

  getMachineById(id: string): Observable<Machine> {
    return this.http.get<Machine>(API_ENDPOINTS.machine(id));
  }

  updateMachineStatus(id: string, status: MachineStatus): Observable<Machine> {
    return this.http.patch<Machine>(API_ENDPOINTS.machine(id), {
      status,
      lastUpdate: new Date().toISOString(),
    });
  }

  /**
   * Polling real-time dei dati sensore per una macchina.
   * I valori sono simulati tramite SensorSimulatorService che rispetta lo stato
   * della macchina: se stopped/maintenance tutti i valori tornano a 0.
   *
   * @param machineId - ID della macchina da monitorare
   * @param getStatus - Callback che restituisce lo stato corrente della macchina
   *                    (signal o funzione pura — evita dipendenza circolare tra servizi)
   */
  pollSensorData(machineId: string, getStatus: () => MachineStatus): Observable<SensorData> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.http.get<SensorData[]>(API_ENDPOINTS.sensorByMachine(machineId))),
      map((sensors) => this.simulator.simulate(sensors[0], getStatus())),
    );
  }

  pollAllMachines(): Observable<Machine[]> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.getMachines()),
    );
  }
}
