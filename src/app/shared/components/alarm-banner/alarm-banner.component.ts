/**
 * @file alarm-banner.component.ts
 * @description Banner globale per la visualizzazione del conteggio allarmi attivi.
 *              Visibile in entrambe le viste SCADA e HMI. Si nasconde automaticamente
 *              quando non ci sono allarmi attivi.
 */

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alarm } from '../../../core/models/alarm.model';

@Component({
  selector: 'app-alarm-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasAlarms()) {
      <div class="alarm-banner" role="alert" aria-live="polite">
        @if (criticalCount() > 0) {
          <span class="alarm-banner__item alarm-banner__item--critical">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
            <strong>{{ criticalCount() }}</strong> CRITICO{{ criticalCount() > 1 ? 'I' : '' }}
          </span>
        }
        @if (warningCount() > 0) {
          <span class="alarm-banner__item alarm-banner__item--warning">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            <strong>{{ warningCount() }}</strong> ATTENZIONE
          </span>
        }
        @if (infoCount() > 0) {
          <span class="alarm-banner__item alarm-banner__item--info">
            <i class="pi pi-info-circle" aria-hidden="true"></i>
            <strong>{{ infoCount() }}</strong> INFO
          </span>
        }
      </div>
    }
  `,
  styles: [`
    .alarm-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
    }

    .alarm-banner__item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 15px;
      font-weight: 500;
      border: 1px solid transparent;
    }

    .alarm-banner__item--critical {
      background: color-mix(in srgb, var(--color-alarm-critical) 15%, transparent);
      color: var(--color-alarm-critical);
      border-color: color-mix(in srgb, var(--color-alarm-critical) 30%, transparent);
    }

    .alarm-banner__item--warning {
      background: color-mix(in srgb, var(--color-alarm-warning) 15%, transparent);
      color: var(--color-alarm-warning);
      border-color: color-mix(in srgb, var(--color-alarm-warning) 30%, transparent);
    }

    .alarm-banner__item--info {
      background: color-mix(in srgb, var(--color-alarm-info) 15%, transparent);
      color: var(--color-alarm-info);
      border-color: color-mix(in srgb, var(--color-alarm-info) 30%, transparent);
    }
  `],
})
export class AlarmBannerComponent {
  alarms = input<Alarm[]>([]);

  criticalCount = computed(() => this.alarms().filter((a) => a.severity === 'critical').length);
  warningCount = computed(() => this.alarms().filter((a) => a.severity === 'warning').length);
  infoCount = computed(() => this.alarms().filter((a) => a.severity === 'info').length);
  hasAlarms = computed(() => this.alarms().length > 0);
}
