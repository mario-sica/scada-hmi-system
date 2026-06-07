/**
 * @file error.interceptor.ts
 * @description Gestione centralizzata degli errori HTTP.
 *              Distingue errori applicativi (4xx) da errori di sistema (5xx)
 *              e da errori di rete (nessuna risposta dal server).
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        // Errore di rete — il server non è raggiungibile
        messageService.add({
          severity: 'error',
          summary: 'Connessione persa',
          detail: 'Impossibile raggiungere il server. Verificare la connessione.',
          sticky: true,
          key: 'network-error',
        });
      } else if (error.status === 404) {
        console.warn(`[ErrorInterceptor] 404 Not Found: ${req.url}`);
        messageService.add({
          severity: 'warn',
          summary: 'Non trovato',
          detail: 'Macchina o risorsa non trovata.',
          life: 5000,
        });
      } else if (error.status >= 500) {
        messageService.add({
          severity: 'error',
          summary: 'Errore server',
          detail: 'Errore interno del server. Riprovare.',
          life: 5000,
        });
      }

      return throwError(() => error);
    })
  );
};
