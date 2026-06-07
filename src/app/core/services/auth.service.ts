/**
 * @file auth.service.ts
 * @description Gate operativo per l'accesso HMI alle singole macchine tramite password locale.
 *              NON è un sistema di autenticazione reale — è una misura di sicurezza operativa
 *              per prevenire azionamenti accidentali su schermi touch condivisi in produzione.
 *
 * @security
 * Le password sono costanti lato client — visibili a chiunque ispezionasse il codice.
 * Questo è intenzionale per il contesto HMI: la sicurezza reale è garantita dalla
 * rete industriale isolata (air gap o VLAN dedicata) e dai sistemi di accesso fisico.
 * Ref: IEC 62443 zone and conduit model.
 *
 * @persistence sessionStorage — l'accesso viene revocato alla chiusura del browser/tab.
 */

import { Injectable } from '@angular/core';
import { MACHINE_PASSWORDS } from '../constants/passwords';

const SESSION_KEY_PREFIX = 'hmi-access-';

@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Verifica se la password inserita è corretta per la macchina specificata.
   *
   * @param machineId - ID della macchina (es. 'M1')
   * @param password - Password inserita dall'operatore
   * @returns true se la password è corretta
   */
  verifyPassword(machineId: string, password: string): boolean {
    return MACHINE_PASSWORDS[machineId] === password;
  }

  /**
   * Concede l'accesso HMI a una macchina per la sessione corrente.
   * @param machineId - ID della macchina
   */
  grantAccess(machineId: string): void {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${machineId}`, 'granted');
  }

  /**
   * Verifica se l'operatore ha già eseguito l'accesso per questa macchina nella sessione.
   * @param machineId - ID della macchina
   * @returns true se l'accesso è stato concesso in questa sessione
   */
  hasAccess(machineId: string): boolean {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${machineId}`) === 'granted';
  }

  /**
   * Revoca l'accesso HMI a una macchina (es. al logout o al ritorno alla SCADA dashboard).
   * @param machineId - ID della macchina
   */
  revokeAccess(machineId: string): void {
    sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${machineId}`);
  }

  /** Operatore di sessione fittizio per audit trail dei comandi. */
  getOperatorId(): string {
    return sessionStorage.getItem('operator-id') ?? 'OPERATOR_DEFAULT';
  }
}
