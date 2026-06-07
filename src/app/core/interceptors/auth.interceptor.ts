/**
 * @file auth.interceptor.ts
 * @description Aggiunge header X-Operator-Session a ogni richiesta HTTP.
 *              Simula l'audit trail reale delle operazioni per tracciabilità.
 *              In produzione questo header verrebbe validato dal backend per
 *              associare ogni operazione all'operatore autenticato.
 */

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const operatorSession = sessionStorage.getItem('operator-id') ?? 'OPERATOR_DEFAULT';

  const cloned = req.clone({
    setHeaders: {
      'X-Operator-Session': operatorSession,
    },
  });

  return next(cloned);
};
