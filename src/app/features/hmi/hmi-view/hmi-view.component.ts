/**
 * @file hmi-view.component.ts
 * @description Vista HMI per il controllo diretto di una singola macchina industriale.
 *              Layout a 3 sezioni: header (stato + navigazione), sensori real-time, comandi.
 *              Gestisce il polling 5s dei sensori e il log allarmi con acknowledge.
 *
 * @architecture
 * HmiViewComponent (route: /hmi/:machineId)
 *   ├── Header: nome macchina, status, back button, last update, connection indicator
 *   ├── SensorPanelComponent: 4 gauge real-time con threshold coloring
 *   ├── ControlPanelComponent: START/STOP/RESET/EMERGENCY con double-confirm
 *   └── AlarmLogComponent: tabella allarmi con acknowledge
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval, startWith, switchMap } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { MachineService } from '../../../core/services/machine.service';
import { AlarmService } from '../../../core/services/alarm.service';
import { CommandService } from '../../../core/services/command.service';
import { AuthService } from '../../../core/services/auth.service';
import { Machine } from '../../../core/models/machine.model';
import { SensorData } from '../../../core/models/sensor-data.model';
import { Alarm, AlarmSeverity } from '../../../core/models/alarm.model';
import { CommandType, ControlCommand } from '../../../core/models/control-command.model';
import { getSensorThresholdLevel, SENSOR_THRESHOLDS } from '../../../core/constants/thresholds';

import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SensorPanelComponent } from '../sensor-panel/sensor-panel.component';
import { ControlPanelComponent } from '../control-panel/control-panel.component';
import { AlarmLogComponent } from '../alarm-log/alarm-log.component';

@Component({
  selector: 'app-hmi-view',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ButtonModule,
    DialogModule,
    StatusBadgeComponent,
    SensorPanelComponent,
    ControlPanelComponent,
    AlarmLogComponent,
  ],
  providers: [MessageService],
  template: `
    <p-toast position="top-center" />

    <div class="hmi-view">
      <!-- Header HMI -->
      <header class="hmi-header">
        <div class="hmi-header__left">
          <button
            class="hmi-back-btn"
            (click)="navigateBack()"
            aria-label="Torna alla Dashboard SCADA"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            <span>SCADA</span>
          </button>

          @if (machine()) {
            <div class="hmi-header__machine">
              <span class="hmi-machine-id">{{ machine()!.id }}</span>
              <h1 class="hmi-machine-name">{{ machine()!.name }}</h1>
              <app-status-badge [status]="machine()!.status" />
            </div>
          }
        </div>

        <div class="hmi-header__right">
          @if (machine()) {
            <span class="hmi-last-update">
              <i class="pi pi-clock" aria-hidden="true"></i>
              {{ lastUpdateLabel() }}
            </span>
          }
          <span
            class="connection-indicator"
            [class.connection-indicator--ok]="apiOnline()"
            [class.connection-indicator--lost]="!apiOnline()"
          >
            <i class="pi" [class.pi-wifi]="apiOnline()" [class.pi-wifi-off]="!apiOnline()" aria-hidden="true"></i>
            {{ apiOnline() ? 'Online' : 'Offline' }}
          </span>
        </div>
      </header>

      <!-- Corpo HMI -->
      @if (machine(); as m) {
        <div class="hmi-body">
          <div class="hmi-body__main">
            <app-sensor-panel [sensorData]="sensorData()" />
            <app-control-panel [machine]="m" (commandRequest)="handleCommand($event)" />
          </div>
          <div class="hmi-body__side">
            <app-alarm-log [alarms]="alarms()" (acknowledge)="acknowledgeAlarm($event)" />
          </div>
        </div>
      } @else {
        <div class="hmi-loading">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem" aria-hidden="true"></i>
          <p>Caricamento macchina {{ machineId() }}...</p>
        </div>
      }
    </div>

    <!-- Conferma navigazione indietro durante running -->
    <p-dialog
      [visible]="backConfirmVisible()"
      (visibleChange)="backConfirmVisible.set($event)"
      header="Attenzione — Macchina in marcia"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '420px' }"
      [draggable]="false"
    >
      <p style="color: var(--color-text-primary); line-height: 1.6;">
        La macchina è attualmente <strong>in marcia</strong>.
        Tornando alla dashboard non verrà inviato alcun comando di arresto.
        Vuoi continuare?
      </p>
      <ng-template pTemplate="footer">
        <button pButton label="Rimani" severity="secondary" outlined (click)="backConfirmVisible.set(false)"></button>
        <button pButton label="Torna alla Dashboard" icon="pi pi-arrow-left" (click)="confirmBack()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .hmi-view {
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-base);
    }

    .hmi-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      gap: 16px;
      flex-wrap: wrap;
    }

    .hmi-header__left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .hmi-header__right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hmi-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      min-height: 48px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      color: var(--color-text-primary);
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 150ms ease, border-color 150ms ease;

      &:hover {
        background: var(--color-bg-overlay);
        border-color: var(--color-border-focus);
      }
    }

    .hmi-header__machine {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .hmi-machine-id {
      font-family: 'Roboto Mono', monospace;
      font-size: 15px;
      font-weight: 700;
      color: var(--color-text-secondary);
      background: var(--color-bg-elevated);
      padding: 3px 10px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }

    .hmi-machine-name {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .hmi-last-update {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .connection-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 15px;
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

    .hmi-body {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 20px;
      padding: 24px;
      align-items: start;
    }

    .hmi-body__main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .hmi-body__side {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .hmi-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 80px;
      color: var(--color-text-secondary);
    }
  `],
})
export class HmiViewComponent implements OnInit, OnDestroy {
  private machineService = inject(MachineService);
  private alarmService = inject(AlarmService);
  private commandService = inject(CommandService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  machineId = signal<string>('');
  machine = signal<Machine | null>(null);
  sensorData = signal<SensorData | null>(null);
  alarms = signal<Alarm[]>([]);
  apiOnline = signal<boolean>(true);
  backConfirmVisible = signal<boolean>(false);

  /** Tiene traccia dei sensori con allarme attivo per evitare duplicati ogni polling */
  private activeAlarmKeys = new Set<string>();

  lastUpdateLabel = computed(() => {
    const m = this.machine();
    if (!m) return '';
    return new Date(m.lastUpdate).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('machineId') ?? '';
    this.machineId.set(id);
    this.startMachinePolling(id);
    this.startSensorPolling(id);
    this.loadAlarms(id);
  }

  private startMachinePolling(machineId: string): void {
    interval(5000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.machineService.getMachineById(machineId))
    ).subscribe({
      next: (machine) => {
        this.machine.set(machine);
        this.apiOnline.set(true);
      },
      error: () => this.apiOnline.set(false),
    });
  }

  private startSensorPolling(machineId: string): void {
    // Passa il callback di stato: il simulatore usa lo stato attuale della macchina
    // per azzerare i sensori se stopped/maintenance
    this.machineService.pollSensorData(machineId, () => this.machine()?.status ?? 'stopped').pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (sensor) => {
        this.sensorData.set(sensor);
        this.checkThresholdAlarms(sensor);
      },
      error: () => {},
    });
  }

  private loadAlarms(machineId: string): void {
    interval(10000).pipe(
      startWith(0),
      takeUntil(this.destroy$),
      switchMap(() => this.alarmService.getAlarmsByMachine(machineId))
    ).subscribe({
      next: (alarms) => this.alarms.set(alarms),
      error: () => {},
    });
  }

  private checkThresholdAlarms(sensor: SensorData): void {
    const checks: Array<{ key: 'temperature' | 'pressure' | 'rpm' | 'vibration'; label: string; unit: string }> = [
      { key: 'temperature', label: 'Temperatura', unit: '°C'   },
      { key: 'pressure',    label: 'Pressione',   unit: 'bar'  },
      { key: 'rpm',         label: 'Velocità',    unit: 'rpm'  },
      { key: 'vibration',   label: 'Vibrazione',  unit: 'mm/s' },
    ];

    const machineId = this.machineId();

    checks.forEach(({ key, label, unit }) => {
      const level    = getSensorThresholdLevel(key, sensor[key]);
      const alarmKey = `${machineId}-${key}`;

      if (level === 'normal') {
        // Condizione rientrata: rimuove dal set così la prossima anomalia crea un nuovo allarme
        this.activeAlarmKeys.delete(alarmKey);
        return;
      }

      // Allarme già attivo per questo sensore — non duplicare
      if (this.activeAlarmKeys.has(alarmKey)) return;
      this.activeAlarmKeys.add(alarmKey);

      const threshold = SENSOR_THRESHOLDS[key][level];
      const severity: AlarmSeverity = level === 'critical' ? 'critical' : 'warning';

      this.alarmService.createAlarm({
        machineId,
        message:      `${label} in zona ${level} (${sensor[key]} ${unit} > ${threshold} ${unit})`,
        severity,
        timestamp:    new Date().toISOString(),
        acknowledged: false,
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: (created) => {
          this.alarms.update((list) => [created, ...list]);
          this.messageService.add({
            severity: level === 'critical' ? 'error' : 'warn',
            summary:  `${label} ${level === 'critical' ? 'CRITICA' : 'WARNING'}`,
            detail:   `${sensor[key]} ${unit} — allarme registrato`,
            life:     6000,
          });
        },
        error: () => {},
      });

      // Soglia critical + macchina in marcia → porta in fault
      if (level === 'critical' && this.machine()?.status === 'running') {
        this.machineService.updateMachineStatus(machineId, 'fault').pipe(
          takeUntil(this.destroy$),
        ).subscribe({
          next: (m) => this.machine.set(m),
          error: () => {},
        });
      }
    });
  }

  handleCommand(commandType: CommandType): void {
    const machineId = this.machineId();
    const command: ControlCommand = {
      machineId,
      command: commandType,
      operatorId: this.authService.getOperatorId(),
      timestamp: new Date().toISOString(),
    };

    this.commandService.sendCommand(command).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Comando inviato',
          detail: `${commandType} eseguito su ${machineId}`,
          life: 3000,
        });
        // Forza un reload immediato dello stato macchina
        this.machineService.getMachineById(machineId).pipe(
          takeUntil(this.destroy$)
        ).subscribe((m) => this.machine.set(m));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Errore comando',
          detail: 'Il comando non è stato eseguito. Riprovare.',
          life: 5000,
        });
      },
    });
  }

  acknowledgeAlarm(alarmId: string): void {
    this.alarmService.acknowledgeAlarm(alarmId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.alarms.update((alarms) =>
          alarms.map((a) => (a.id === alarmId ? { ...a, acknowledged: true } : a))
        );
        this.messageService.add({
          severity: 'info',
          summary: 'Allarme riconosciuto',
          life: 2000,
        });
      },
      error: () => {},
    });
  }

  navigateBack(): void {
    if (this.machine()?.status === 'running') {
      this.backConfirmVisible.set(true);
    } else {
      this.confirmBack();
    }
  }

  confirmBack(): void {
    this.backConfirmVisible.set(false);
    this.authService.revokeAccess(this.machineId());
    this.router.navigate(['/scada']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
