/**
 * @file api-response.model.ts
 * @description Wrapper generico per le risposte REST API.
 *              In questo progetto il JSON Server risponde direttamente con i dati
 *              (senza wrapper), ma questo tipo è usato per future migrazioni verso
 *              un backend reale che segue questa convenzione.
 */

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
  success: boolean;
}
