/**
 * @file passwords.ts
 * @description Password locali per l'accesso HMI alle singole macchine.
 *              ATTENZIONE: questo NON è un sistema di autenticazione reale.
 *              È un gate operativo per prevenire comandi accidentali su schermi touch
 *              condivisi nell'ambiente di produzione.
 *              In un sistema reale l'autenticazione avverrebbe tramite badge RFID,
 *              PIN centralizzato su LDAP/AD, o token hardware.
 */

export const MACHINE_PASSWORDS: Record<string, string> = {
  M1: '1234',
  M2: '2345',
  M3: '3456',
  M4: '4567',
};
