/**
 * @file hmi-access.guard.ts
 * @description Guard che verifica se l'operatore ha eseguito l'accesso per la macchina
 *              specificata nel parametro route prima di consentire la navigazione a /hmi/:machineId.
 *              Se non autenticato, reindirizza a /scada (la dashboard è sempre accessibile).
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const hmiAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const machineId = route.paramMap.get('machineId');

  if (!machineId) {
    return router.createUrlTree(['/scada']);
  }

  if (authService.hasAccess(machineId)) {
    return true;
  }

  // Reindirizza alla dashboard con un parametro che triggera l'apertura del dialog
  return router.createUrlTree(['/scada'], {
    queryParams: { openMachine: machineId },
  });
};
