/**
 * @file machine-card.component.ts
 * @description Card della macchina nella SCADA dashboard.
 *              Mostra stato, temperatura e RPM correnti con aggiornamento real-time.
 *              Al click emette un evento per aprire il dialog di accesso HMI.
 */

import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Machine } from '../../../core/models/machine.model';
import { SensorData } from '../../../core/models/sensor-data.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { getSensorThresholdLevel } from '../../../core/constants/thresholds';

@Component({
  selector: 'app-machine-card',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, StatusBadgeComponent],
  template: `
    <div
      class="machine-card machine-card--{{ machine().status }}"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick()"
      tabindex="0"
      role="button"
      [attr.aria-label]="'Apri HMI per ' + machine().name"
    >
      <div class="machine-card__header">
        <span class="machine-card__id">{{ machine().id }}</span>
        <app-status-badge [status]="machine().status" />
      </div>

      <h3 class="machine-card__name">{{ machine().name }}</h3>

      @if (sensorData()) {
        <div class="machine-card__sensors">
          <div class="machine-card__sensor" [class]="'sensor-level--' + tempLevel()">
            <span class="machine-card__sensor-label">Temp.</span>
            <span class="machine-card__sensor-value value-numeric-sm">
              {{ sensorData()!.temperature.toFixed(1) }}
            </span>
            <span class="label-unit">°C</span>
          </div>
          <div class="machine-card__sensor" [class]="'sensor-level--' + rpmLevel()">
            <span class="machine-card__sensor-label">RPM</span>
            <span class="machine-card__sensor-value value-numeric-sm">
              {{ sensorData()!.rpm }}
            </span>
            <span class="label-unit">rpm</span>
          </div>
        </div>
      } @else {
        <div class="machine-card__no-data">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          <span>Caricamento...</span>
        </div>
      }

      <div class="machine-card__footer">
        <span class="machine-card__update">
          <i class="pi pi-clock" aria-hidden="true"></i>
          {{ lastUpdateLabel() }}
        </span>
        <button class="machine-card__access-btn" aria-label="Accedi all'HMI">
          <i class="pi pi-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .machine-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: border-color 200ms ease, background-color 200ms ease, transform 100ms ease;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 180px;
      outline: none;
      position: relative;

      &:hover, &:focus-visible {
        border-color: var(--color-border-focus);
        background: var(--color-bg-elevated);
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .machine-card--fault {
      border-color: color-mix(in srgb, var(--color-status-fault) 40%, var(--color-border));
    }

    .machine-card--maintenance {
      border-color: color-mix(in srgb, var(--color-status-maintenance) 40%, var(--color-border));
    }

    .machine-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .machine-card__id {
      font-family: var(--font-mono, 'Roboto Mono', monospace);
      font-size: 15px;
      font-weight: 600;
      color: var(--color-text-secondary);
      background: var(--color-bg-elevated);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }

    .machine-card__name {
      font-size: 17px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.3;
    }

    .machine-card__sensors {
      display: flex;
      gap: 16px;
    }

    .machine-card__sensor {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 6px 10px;
      background: var(--color-bg-elevated);
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }

    .machine-card__sensor-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.04em;
      margin-right: 2px;
    }

    .machine-card__sensor-value {
      font-family: 'Roboto Mono', monospace;
      font-size: 17px;
      font-weight: 500;
    }

    .sensor-level--normal .machine-card__sensor-value { color: var(--color-sensor-normal); }
    .sensor-level--warning .machine-card__sensor-value { color: var(--color-sensor-warning); }
    .sensor-level--critical .machine-card__sensor-value { color: var(--color-sensor-critical); }

    .machine-card__no-data {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-secondary);
      font-size: 15px;
    }

    .machine-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
    }

    .machine-card__update {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .machine-card__access-btn {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 6px 8px;
      cursor: pointer;
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      transition: background-color 150ms ease, color 150ms ease;

      &:hover {
        background: var(--color-border-focus);
        color: var(--color-text-inverse);
        border-color: var(--color-border-focus);
      }
    }
  `],
})
export class MachineCardComponent {
  machine = input.required<Machine>();
  sensorData = input<SensorData | null>(null);
  cardClick = output<Machine>();

  tempLevel = computed(() =>
    this.sensorData() ? getSensorThresholdLevel('temperature', this.sensorData()!.temperature) : 'normal'
  );

  rpmLevel = computed(() =>
    this.sensorData() ? getSensorThresholdLevel('rpm', this.sensorData()!.rpm) : 'normal'
  );

  lastUpdateLabel = computed(() => {
    const date = new Date(this.machine().lastUpdate);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  });

  onCardClick(): void {
    this.cardClick.emit(this.machine());
  }
}
