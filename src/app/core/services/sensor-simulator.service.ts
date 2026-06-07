/**
 * @file sensor-simulator.service.ts
 * @description Simula la variazione realistica dei valori sensore lato frontend.
 *              In produzione questo layer non esisterebbe: i dati arriverebbero già
 *              variati dal PLC/OPC-UA gateway ad ogni scan cycle.
 *
 * Regole di simulazione:
 *  - Macchina stopped/maintenance → tutti i valori a 0 (impianto spento)
 *  - Macchina running/fault       → variazione casuale entro range realistici
 *  - Tutti i valori sono clampati a >= 0 (RPM, pressione, vibrazione non possono
 *    essere negativi; temperatura non può scendere sotto la temperatura ambiente)
 */

import { Injectable } from '@angular/core';
import { MachineStatus } from '../models/machine.model';
import { SensorData } from '../models/sensor-data.model';

/** Range di variazione per ogni sensore (±delta ad ogni polling) */
interface SensorDelta {
  readonly temperature: number;
  readonly pressure:    number;
  readonly rpm:         number;
  readonly vibration:   number;
}

/** Valori minimi fisicamente possibili */
interface SensorFloor {
  readonly temperature: number;  // temperatura ambiente minima
  readonly pressure:    number;
  readonly rpm:         number;
  readonly vibration:   number;
}

const DELTA: SensorDelta = {
  temperature: 1.5,
  pressure:    0.15,
  rpm:         40,
  vibration:   0.2,
};

const FLOOR: SensorFloor = {
  temperature: 15,   // °C — temperatura ambiente minima realistica
  pressure:    0,
  rpm:         0,
  vibration:   0,
};

/** Stati in cui i sensori sono attivi e producono letture reali */
const ACTIVE_STATES: ReadonlySet<MachineStatus> = new Set(['running', 'fault']);

@Injectable({ providedIn: 'root' })
export class SensorSimulatorService {
  /**
   * Applica la simulazione a un campione sensore.
   * Se la macchina è ferma o in manutenzione restituisce valori a zero.
   * Tutti i valori sono clampati al loro floor fisico.
   *
   * @param seed    - Valore base letto dal db (JSON Server)
   * @param status  - Stato corrente della macchina
   * @returns       SensorData con valori simulati
   */
  simulate(seed: SensorData, status: MachineStatus): SensorData {
    if (!ACTIVE_STATES.has(status)) {
      return this.zeroed(seed);
    }

    return {
      ...seed,
      temperature: this.vary(seed.temperature, DELTA.temperature, FLOOR.temperature),
      pressure:    this.vary(seed.pressure,    DELTA.pressure,    FLOOR.pressure),
      rpm:         Math.round(this.vary(seed.rpm, DELTA.rpm, FLOOR.rpm)),
      vibration:   this.vary(seed.vibration,   DELTA.vibration,   FLOOR.vibration),
      timestamp:   new Date().toISOString(),
    };
  }

  /** Resetta tutti i valori sensore a zero (macchina spenta) */
  private zeroed(seed: SensorData): SensorData {
    return {
      ...seed,
      temperature: 0,
      pressure:    0,
      rpm:         0,
      vibration:   0,
      timestamp:   new Date().toISOString(),
    };
  }

  /** Varia un valore entro ±delta e lo clampa al floor minimo */
  private vary(base: number, delta: number, floor: number): number {
    const varied = base + (Math.random() - 0.5) * 2 * delta;
    return +Math.max(floor, varied).toFixed(2);
  }
}
