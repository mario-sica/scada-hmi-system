/**
 * @file alarm-log.component.ts
 * @description Log allarmi della singola macchina con possibilità di acknowledge.
 *              Allarmi non riconosciuti mostrati per primi, poi per timestamp decrescente.
 *              Tabella PrimeNG con colonne: Severità, Messaggio, Timestamp, Stato/Azione.
 */

import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Alarm, AlarmSeverity } from '../../../core/models/alarm.model';

const SEVERITY_ICONS: Record<AlarmSeverity, string> = {
  critical: 'pi pi-exclamation-circle',
  warning: 'pi pi-exclamation-triangle',
  info: 'pi pi-info-circle',
};

const SEVERITY_LABELS: Record<AlarmSeverity, string> = {
  critical: 'CRITICO',
  warning: 'ATTENZIONE',
  info: 'INFO',
};

@Component({
  selector: 'app-alarm-log',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, TagModule],
  template: `
    <section class="alarm-log" aria-label="Log allarmi macchina">
      <div class="alarm-log__header">
        <h2 class="alarm-log__title">
          <i class="pi pi-bell" aria-hidden="true"></i>
          Log Allarmi
        </h2>
        <div class="alarm-log__counts">
          @if (activeCount() > 0) {
            <span class="alarm-count alarm-count--active">
              {{ activeCount() }} attivo{{ activeCount() > 1 ? 'i' : '' }}
            </span>
          }
          <span class="alarm-count alarm-count--total">{{ sortedAlarms().length }} totali</span>
        </div>
      </div>

      @if (sortedAlarms().length === 0) {
        <div class="alarm-log__empty">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          Nessun allarme registrato per questa macchina
        </div>
      } @else {
        <p-table [value]="sortedAlarms()" [scrollable]="true" scrollHeight="320px" styleClass="alarm-table">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 130px">Severità</th>
              <th>Messaggio</th>
              <th style="width: 130px">Timestamp</th>
              <th style="width: 130px">Stato</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-alarm>
            <tr [class.alarm-row--critical]="alarm.severity === 'critical' && !alarm.acknowledged"
                [class.alarm-row--active]="!alarm.acknowledged">
              <td>
                <span class="severity-badge severity-badge--{{ alarm.severity }}">
                  <i [class]="severityIcon(alarm.severity)" aria-hidden="true"></i>
                  {{ severityLabel(alarm.severity) }}
                </span>
              </td>
              <td class="alarm-message">{{ alarm.message }}</td>
              <td class="alarm-timestamp">{{ alarm.timestamp | date:'dd/MM HH:mm' }}</td>
              <td>
                @if (!alarm.acknowledged) {
                  <button
                    class="ack-btn"
                    (click)="acknowledge.emit(alarm.id)"
                    [attr.aria-label]="'Acknowledge allarme: ' + alarm.message"
                  >
                    <i class="pi pi-check" aria-hidden="true"></i>
                    ACK
                  </button>
                } @else {
                  <span class="ack-done">
                    <i class="pi pi-check-circle" aria-hidden="true"></i>
                    Riconosciuto
                  </span>
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </section>
  `,
  styles: [`
    .alarm-log {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 20px;
    }

    .alarm-log__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .alarm-log__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .alarm-log__counts {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .alarm-count {
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
    }

    .alarm-count--active {
      background: color-mix(in srgb, var(--color-alarm-critical) 15%, transparent);
      color: var(--color-alarm-critical);
      border: 1px solid color-mix(in srgb, var(--color-alarm-critical) 30%, transparent);
    }

    .alarm-count--total {
      background: var(--color-bg-elevated);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .alarm-log__empty {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-sensor-normal);
      padding: 24px 0;
      font-size: 16px;
    }

    .severity-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      border: 1px solid transparent;
    }

    .severity-badge--critical {
      background: color-mix(in srgb, var(--color-alarm-critical) 15%, transparent);
      color: var(--color-alarm-critical);
      border-color: color-mix(in srgb, var(--color-alarm-critical) 30%, transparent);
    }

    .severity-badge--warning {
      background: color-mix(in srgb, var(--color-alarm-warning) 15%, transparent);
      color: var(--color-alarm-warning);
      border-color: color-mix(in srgb, var(--color-alarm-warning) 30%, transparent);
    }

    .severity-badge--info {
      background: color-mix(in srgb, var(--color-alarm-info) 15%, transparent);
      color: var(--color-alarm-info);
      border-color: color-mix(in srgb, var(--color-alarm-info) 30%, transparent);
    }

    .alarm-message {
      font-size: 15px;
      color: var(--color-text-primary);
    }

    .alarm-timestamp {
      font-family: 'Roboto Mono', monospace;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .alarm-row--active td {
      background: color-mix(in srgb, var(--color-alarm-warning) 5%, transparent) !important;
    }

    .alarm-row--critical td {
      background: color-mix(in srgb, var(--color-alarm-critical) 8%, transparent) !important;
    }

    .ack-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      min-height: 32px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      cursor: pointer;
      transition: background-color 150ms ease;

      &:hover {
        background: var(--color-border-focus);
        color: var(--color-text-inverse);
        border-color: var(--color-border-focus);
      }
    }

    .ack-done {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: var(--color-sensor-normal);
    }
  `],
})
export class AlarmLogComponent {
  alarms = input<Alarm[]>([]);
  acknowledge = output<string>();

  sortedAlarms = computed(() =>
    [...this.alarms()].sort((a, b) => {
      // Non-acknowledged prima
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      // Poi per timestamp decrescente
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    })
  );

  activeCount = computed(() => this.alarms().filter((a) => !a.acknowledged).length);

  severityIcon = (severity: AlarmSeverity) => SEVERITY_ICONS[severity];
  severityLabel = (severity: AlarmSeverity) => SEVERITY_LABELS[severity];
}
