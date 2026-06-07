/**
 * @file status-badge.component.ts
 * @description Badge visivo per lo stato operativo di una macchina.
 *              Usa CSS custom properties per rispettare entrambi i temi dark/light.
 */

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MachineStatus } from '../../../core/models/machine.model';

const STATUS_LABELS: Record<MachineStatus, string> = {
  running: 'In marcia',
  stopped: 'Fermo',
  fault: 'Guasto',
  maintenance: 'Manutenzione',
};

const STATUS_ICONS: Record<MachineStatus, string> = {
  running: 'pi pi-play-circle',
  stopped: 'pi pi-stop-circle',
  fault: 'pi pi-exclamation-triangle',
  maintenance: 'pi pi-wrench',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge status-badge--{{ status() }}" [attr.aria-label]="label()">
      <i [class]="icon()" aria-hidden="true"></i>
      <span>{{ label() }}</span>
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid transparent;

      i {
        font-size: 13px;
      }
    }

    .status-badge--running {
      background: color-mix(in srgb, var(--color-status-running) 15%, transparent);
      color: var(--color-status-running);
      border-color: color-mix(in srgb, var(--color-status-running) 30%, transparent);
    }

    .status-badge--stopped {
      background: color-mix(in srgb, var(--color-status-stopped) 15%, transparent);
      color: var(--color-status-stopped);
      border-color: color-mix(in srgb, var(--color-status-stopped) 30%, transparent);
    }

    .status-badge--fault {
      background: color-mix(in srgb, var(--color-status-fault) 15%, transparent);
      color: var(--color-status-fault);
      border-color: color-mix(in srgb, var(--color-status-fault) 30%, transparent);
    }

    .status-badge--maintenance {
      background: color-mix(in srgb, var(--color-status-maintenance) 15%, transparent);
      color: var(--color-status-maintenance);
      border-color: color-mix(in srgb, var(--color-status-maintenance) 30%, transparent);
    }
  `],
})
export class StatusBadgeComponent {
  status = input.required<MachineStatus>();

  label = () => STATUS_LABELS[this.status()];
  icon = () => STATUS_ICONS[this.status()];
}
