/**
 * @file scada-dashboard.component.ts
 * @description Vista SCADA principale — griglia 2×2 con le 4 macchine industriali.
 *              Implementa il polling 5s per aggiornamenti real-time (simula scan cycle PLC).
 *              Gestisce il dialog di accesso HMI con verifica password locale.
 *
 * @architecture
 * ScadaDashboardComponent
 *   ├── AlarmBannerComponent (allarmi attivi globali)
 *   ├── MachineCardComponent × 4 (grid 2×2)
 *   └── Dialog PrimeNG (password per accesso HMI)
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, startWith, switchMap, merge, forkJoin } from 'rxjs';

import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

import { MachineService } from '../../../core/services/machine.service';
import { AlarmService } from '../../../core/services/alarm.service';
import { AuthService } from '../../../core/services/auth.service';
import { SensorSimulatorService } from '../../../core/services/sensor-simulator.service';
import { Machine } from '../../../core/models/machine.model';
import { SensorData } from '../../../core/models/sensor-data.model';
import { Alarm } from '../../../core/models/alarm.model';
import { MachineCardComponent } from '../machine-card/machine-card.component';
import { AlarmBannerComponent } from '../../../shared/components/alarm-banner/alarm-banner.component';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/constants/api-endpoints';

@Component({
  selector: 'app-scada-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MachineCardComponent,
    AlarmBannerComponent,
  ],
  template: `
    <div class="scada-dashboard">
      <app-alarm-banner [alarms]="activeAlarms()" />

      <div class="scada-dashboard__header">
        <div>
          <h1 class="scada-dashboard__title">
            <i class="pi pi-desktop" aria-hidden="true"></i>
            Dashboard SCADA
          </h1>
          <p class="scada-dashboard__subtitle">Monitoraggio impianti — aggiornamento ogni 5s</p>
        </div>
        <div class="scada-dashboard__status-bar">
          <span class="connection-indicator"
            [class.connection-indicator--ok]="apiOnline()"
            [class.connection-indicator--lost]="!apiOnline()"
          >
            <i class="pi" [class.pi-wifi]="apiOnline()" [class.pi-wifi-off]="!apiOnline()" aria-hidden="true"></i>
            {{ apiOnline() ? 'Connesso' : 'Disconnesso' }}
          </span>
        </div>
      </div>

      <div class="scada-dashboard__grid">
        @for (machine of machines(); track machine.id) {
          <app-machine-card
            [machine]="machine"
            [sensorData]="sensorMap()[machine.id] ?? null"
            (cardClick)="openAccessDialog($event)"
          />
        }
        @empty {
          <div class="scada-dashboard__loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem" aria-hidden="true"></i>
            <p>Caricamento macchine...</p>
          </div>
        }
      </div>
    </div>

    <!-- Dialog accesso HMI -->
    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="onDialogVisibleChange($event)"
      [header]="selectedMachine() ? 'Accesso HMI — ' + selectedMachine()!.name : 'Accesso HMI'"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '420px' }"
      [draggable]="false"
    >
      @if (selectedMachine()) {
        <div class="access-dialog">
          <div class="access-dialog__machine-info">
            <span class="machine-id-badge">{{ selectedMachine()!.id }}</span>
            <span class="access-dialog__machine-name">{{ selectedMachine()!.name }}</span>
          </div>

          <div class="access-dialog__form">
            <label for="hmi-password" class="access-dialog__label">
              Password operatore
            </label>
            <input
              id="hmi-password"
              type="password"
              pInputText
              [(ngModel)]="passwordInput"
              placeholder="Inserire password..."
              class="access-dialog__input"
              (keydown.enter)="submitPassword()"
              autocomplete="off"
            />
            @if (passwordError()) {
              <div class="access-dialog__error" role="alert">
                <i class="pi pi-times-circle" aria-hidden="true"></i>
                {{ passwordError() }}
              </div>
            }
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <button pButton label="Annulla" severity="secondary" outlined (click)="closeDialog()"></button>
        <button pButton label="Accedi" icon="pi pi-sign-in" (click)="submitPassword()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .scada-dashboard {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-base);
    }

    .scada-dashboard__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .scada-dashboard__title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 22px;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 4px;
    }

    .scada-dashboard__subtitle {
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .connection-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid transparent;
    }

    .connection-indicator--ok {
      background: color-mix(in srgb, var(--color-connection-ok) 15%, transparent);
      color: var(--color-connection-ok);
      border-color: color-mix(in srgb, var(--color-connection-ok) 30%, transparent);
    }

    .connection-indicator--lost {
      background: color-mix(in srgb, var(--color-connection-lost) 15%, transparent);
      color: var(--color-connection-lost);
      border-color: color-mix(in srgb, var(--color-connection-lost) 30%, transparent);
    }

    .scada-dashboard__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      padding: 24px;
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
    }

    .scada-dashboard__loading {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px;
      color: var(--color-text-secondary);
    }

    .access-dialog {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 4px 0;
    }

    .access-dialog__machine-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 6px;
    }

    .machine-id-badge {
      font-family: 'Roboto Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      background: var(--color-bg-overlay);
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }

    .access-dialog__machine-name {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .access-dialog__form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .access-dialog__label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .access-dialog__input {
      width: 100%;
    }

    .access-dialog__error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-alarm-critical);
      font-size: 13px;
      font-weight: 500;
      padding: 8px 12px;
      background: color-mix(in srgb, var(--color-alarm-critical) 10%, transparent);
      border-radius: 4px;
      border: 1px solid color-mix(in srgb, var(--color-alarm-critical) 25%, transparent);
    }
  `],
})
export class ScadaDashboardComponent implements OnInit, OnDestroy {
  private machineService = inject(MachineService);
  private alarmService   = inject(AlarmService);
  private authService    = inject(AuthService);
  private simulator      = inject(SensorSimulatorService);
  private http           = inject(HttpClient);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private destroy$       = new Subject<void>();

  machines = signal<Machine[]>([]);
  sensorMap = signal<Record<string, SensorData>>({});
  activeAlarms = signal<Alarm[]>([]);
  apiOnline = signal<boolean>(true);

  dialogVisible = signal<boolean>(false);
  selectedMachine = signal<Machine | null>(null);
  passwordError = signal<string>('');
  passwordInput = '';

  ngOnInit(): void {
    this.startMachinePolling();
    this.startSensorPolling();
    this.startAlarmPolling();
    this.checkQueryParams();
  }

  private startMachinePolling(): void {
    interval(5000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.machineService.getMachines())
    ).subscribe({
      next: (machines) => {
        this.machines.set(machines);
        this.apiOnline.set(true);
      },
      error: () => this.apiOnline.set(false),
    });
  }

  private startSensorPolling(): void {
    interval(5000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.http.get<SensorData[]>(API_ENDPOINTS.sensors)),
    ).subscribe({
      next: (sensors) => {
        const machineIndex = new Map(this.machines().map((m) => [m.id, m]));
        const map: Record<string, SensorData> = {};
        sensors.forEach((s) => {
          const machine = machineIndex.get(s.machineId);
          // Se la macchina non è ancora in stato noto, skip (polling macchine non ancora completato)
          if (!machine) return;
          map[s.machineId] = this.simulator.simulate(s, machine.status);
        });
        this.sensorMap.set(map);
      },
      error: () => {},
    });
  }

  private startAlarmPolling(): void {
    interval(10000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.alarmService.getActiveAlarms())
    ).subscribe({
      next: (alarms) => this.activeAlarms.set(alarms),
      error: () => {},
    });
  }

  private checkQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['openMachine']) {
        // Aspetta che le macchine siano caricate
        const tryOpen = () => {
          const machine = this.machines().find((m) => m.id === params['openMachine']);
          if (machine) {
            this.openAccessDialog(machine);
          } else {
            setTimeout(tryOpen, 500);
          }
        };
        setTimeout(tryOpen, 300);
      }
    });
  }

  openAccessDialog(machine: Machine): void {
    if (this.authService.hasAccess(machine.id)) {
      this.router.navigate(['/hmi', machine.id]);
      return;
    }
    this.selectedMachine.set(machine);
    this.passwordInput = '';
    this.passwordError.set('');
    this.dialogVisible.set(true);
  }

  onDialogVisibleChange(visible: boolean): void {
    if (!visible) this.closeDialog();
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedMachine.set(null);
    this.passwordInput = '';
    this.passwordError.set('');
  }

  submitPassword(): void {
    const machine = this.selectedMachine();
    if (!machine) return;

    if (!this.passwordInput.trim()) {
      this.passwordError.set('Inserire la password per continuare.');
      return;
    }

    if (this.authService.verifyPassword(machine.id, this.passwordInput)) {
      this.authService.grantAccess(machine.id);
      this.closeDialog();
      this.router.navigate(['/hmi', machine.id]);
    } else {
      this.passwordError.set('Password errata. Riprovare.');
      this.passwordInput = '';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
