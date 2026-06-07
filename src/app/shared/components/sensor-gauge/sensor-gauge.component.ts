/**
 * @file sensor-gauge.component.ts
 * @description Card per la visualizzazione di un valore sensore con indicazione
 *              cromatica della soglia (normal/warning/critical).
 *              Non usa una libreria gauge esterna per mantenere le dipendenze minimali
 *              e il bundle size sotto controllo.
 */

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThresholdLevel, getSensorThresholdLevel, SensorKey } from '../../../core/constants/thresholds';

@Component({
  selector: 'app-sensor-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sensor-gauge sensor-gauge--{{ level() }}" [attr.aria-label]="label() + ': ' + value() + ' ' + unit()">
      <div class="sensor-gauge__label">{{ label() }}</div>
      <div class="sensor-gauge__value">
        <span class="value-numeric">{{ displayValue() }}</span>
        <span class="label-unit">{{ unit() }}</span>
      </div>
      <div class="sensor-gauge__bar">
        <div class="sensor-gauge__bar-fill" [style.width.%]="percentage()"></div>
      </div>
      <div class="sensor-gauge__status">
        <i [class]="statusIcon()" aria-hidden="true"></i>
        <span>{{ statusLabel() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .sensor-gauge {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 120px;
      transition: border-color 300ms ease;
    }

    .sensor-gauge--warning {
      border-color: var(--color-sensor-warning);
    }

    .sensor-gauge--critical {
      border-color: var(--color-sensor-critical);
      animation: pulse-border 1.5s ease-in-out infinite;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: var(--color-sensor-critical); }
      50% { border-color: color-mix(in srgb, var(--color-sensor-critical) 50%, transparent); }
    }

    .sensor-gauge__label {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
    }

    .sensor-gauge__value {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .sensor-gauge__bar {
      height: 4px;
      background: var(--color-bg-overlay);
      border-radius: 2px;
      overflow: hidden;
    }

    .sensor-gauge__bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 500ms ease, background-color 300ms ease;
      background: var(--current-sensor-color);
    }

    .sensor-gauge--normal .sensor-gauge__bar-fill {
      background: var(--color-sensor-normal);
    }

    .sensor-gauge--warning .sensor-gauge__bar-fill {
      background: var(--color-sensor-warning);
    }

    .sensor-gauge--critical .sensor-gauge__bar-fill {
      background: var(--color-sensor-critical);
    }

    .sensor-gauge__status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }

    .sensor-gauge--normal .sensor-gauge__status {
      color: var(--color-sensor-normal);
    }

    .sensor-gauge--warning .sensor-gauge__status {
      color: var(--color-sensor-warning);
    }

    .sensor-gauge--critical .sensor-gauge__status {
      color: var(--color-sensor-critical);
    }
  `],
})
export class SensorGaugeComponent {
  label = input.required<string>();
  value = input.required<number>();
  unit = input.required<string>();
  sensorKey = input.required<SensorKey>();
  maxValue = input<number>(100);

  level = computed<ThresholdLevel>(() => getSensorThresholdLevel(this.sensorKey(), this.value()));

  displayValue = computed(() => this.value().toFixed(this.unit() === 'bar' ? 1 : 0));

  percentage = computed(() => Math.min(100, (this.value() / this.maxValue()) * 100));

  statusIcon = computed(() => {
    switch (this.level()) {
      case 'critical': return 'pi pi-exclamation-circle';
      case 'warning': return 'pi pi-exclamation-triangle';
      default: return 'pi pi-check-circle';
    }
  });

  statusLabel = computed(() => {
    switch (this.level()) {
      case 'critical': return 'CRITICO';
      case 'warning': return 'ATTENZIONE';
      default: return 'Normale';
    }
  });
}
