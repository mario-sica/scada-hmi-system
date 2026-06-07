import { Routes } from '@angular/router';
import { hmiAccessGuard } from './core/guards/hmi-access.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'scada',
    pathMatch: 'full',
  },
  {
    path: 'scada',
    loadComponent: () =>
      import('./features/scada/scada-dashboard/scada-dashboard.component').then(
        (m) => m.ScadaDashboardComponent
      ),
  },
  {
    path: 'hmi/:machineId',
    canActivate: [hmiAccessGuard],
    loadComponent: () =>
      import('./features/hmi/hmi-view/hmi-view.component').then(
        (m) => m.HmiViewComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'scada',
  },
];
