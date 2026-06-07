/**
 * @file alarm.service.ts
 * @description Gestione allarmi SCADA: recupero, filtraggio per macchina e acknowledgement.
 *              Il sistema di allarmi segue la norma ISA-18.2 per la gestione degli allarmi
 *              nei sistemi di processo industriale.
 *
 * @production-note
 * In un sistema reale gli allarmi sarebbero generati automaticamente dal PLC/DCS
 * in base ai valori di processo. Qui sono gestiti manualmente dall'AlarmService
 * in risposta ai valori sensore che superano le soglie in thresholds.ts.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alarm } from '../models/alarm.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';

@Injectable({ providedIn: 'root' })
export class AlarmService {
  private http = inject(HttpClient);

  /**
   * @param machineId - ID della macchina
   * @returns Observable con tutti gli allarmi della macchina (ack e non-ack)
   */
  getAlarmsByMachine(machineId: string): Observable<Alarm[]> {
    return this.http.get<Alarm[]>(API_ENDPOINTS.alarmsByMachine(machineId));
  }

  /**
   * @returns Observable con tutti gli allarmi non ancora riconosciuti (acknowledged=false)
   */
  getActiveAlarms(): Observable<Alarm[]> {
    return this.http.get<Alarm[]>(API_ENDPOINTS.activeAlarms);
  }

  /**
   * Segna un allarme come riconosciuto dall'operatore (acknowledge).
   * Il PATCH aggiorna solo il campo acknowledged per preservare la history.
   *
   * @param alarmId - ID dell'allarme da riconoscere
   * @returns Observable con i dati allarme aggiornati
   */
  acknowledgeAlarm(alarmId: string): Observable<Alarm> {
    return this.http.patch<Alarm>(API_ENDPOINTS.alarm(alarmId), {
      acknowledged: true,
    });
  }

  /**
   * Crea un nuovo allarme nel sistema (usato da CommandService quando i sensori
   * superano le soglie critical).
   *
   * @param alarm - Dati dell'allarme da creare (senza id, viene assegnato dal server)
   * @returns Observable con l'allarme creato
   */
  createAlarm(alarm: Omit<Alarm, 'id'>): Observable<Alarm> {
    return this.http.post<Alarm>(API_ENDPOINTS.alarms, alarm);
  }
}
