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
import { Observable, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
import { Machine, MachineStatus } from '../models/machine.model';
import { SensorData } from '../models/sensor-data.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class MachineService {
  private http = inject(HttpClient);

  /**
   * @returns Observable array di tutte le macchine registrate nel sistema
   */
  getMachines(): Observable<Machine[]> {
    return this.http.get<Machine[]>(API_ENDPOINTS.machines);
  }

  /**
   * @param id - ID della macchina (es. 'M1')
   * @returns Observable con i dati della macchina richiesta
   * @throws 404 se la macchina non esiste
   */
  getMachineById(id: string): Observable<Machine> {
    return this.http.get<Machine>(API_ENDPOINTS.machine(id));
  }

  /**
   * @param id - ID della macchina
   * @param status - Nuovo stato operativo
   * @returns Observable con i dati macchina aggiornati
   */
  updateMachineStatus(id: string, status: MachineStatus): Observable<Machine> {
    return this.http.patch<Machine>(API_ENDPOINTS.machine(id), {
      status,
      lastUpdate: new Date().toISOString(),
    });
  }

  /**
   * Polling real-time dei dati sensore per una macchina.
   * Usa interval(5000) + switchMap per simulare il ciclo di scansione PLC.
   * startWith(0) fa partire la prima chiamata immediatamente senza aspettare 5s.
   *
   * @param machineId - ID della macchina da monitorare
   * @returns Observable con i dati sensore aggiornati ogni 5 secondi
   */
  pollSensorData(machineId: string): Observable<SensorData> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() =>
        this.http.get<SensorData[]>(API_ENDPOINTS.sensorByMachine(machineId))
      ),
      switchMap((sensors) => {
        // Restituisce il primo sensore trovato per la macchina
        const sensor = sensors[0];
        // Simula variazione realistica dei valori ad ogni polling
        const varied: SensorData = {
          ...sensor,
          temperature: +(sensor.temperature + (Math.random() - 0.5) * 2).toFixed(1),
          pressure: +(sensor.pressure + (Math.random() - 0.5) * 0.2).toFixed(2),
          rpm: Math.round(sensor.rpm + (Math.random() - 0.5) * 50),
          vibration: +(sensor.vibration + (Math.random() - 0.5) * 0.3).toFixed(2),
          timestamp: new Date().toISOString(),
        };
        return [varied];
      })
    );
  }

  /**
   * Polling degli stati di tutte le macchine (usato dalla SCADA dashboard).
   * @returns Observable con array macchine aggiornato ogni 5 secondi
   */
  pollAllMachines(): Observable<Machine[]> {
    return interval(5000).pipe(
      startWith(0),
      switchMap(() => this.getMachines())
    );
  }
}
