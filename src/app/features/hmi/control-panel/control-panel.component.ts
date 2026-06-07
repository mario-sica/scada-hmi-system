/**
 * @file control-panel.component.ts
 * @description Pannello comandi HMI con START/STOP/RESET/EMERGENCY STOP.
 *              Ogni comando richiede doppia conferma via ConfirmDialog PrimeNG.
 *              I pulsanti sono abilitati/disabilitati in base allo stato corrente della macchina.
 */

import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { Machine, MachineStatus } from '../../../core/models/machine.model';
import { CommandType } from '../../../core/models/control-command.model';

interface CommandConfig {
  type: CommandType;
  label: string;
  icon: string;
  cssClass: string;
  enabledStates: MachineStatus[];
  confirmMessage: string;
}

const COMMANDS: CommandConfig[] = [
  {
    type: 'START',
    label: 'START',
    icon: 'pi pi-play',
    cssClass: 'cmd-start',
    enabledStates: ['stopped'],
    confirmMessage: 'Avviare la macchina? Verificare che l\'area sia libera prima di procedere.',
  },
  {
    type: 'STOP',
    label: 'STOP',
    icon: 'pi pi-stop',
    cssClass: 'cmd-stop',
    enabledStates: ['running'],
    confirmMessage: 'Fermare la macchina? Il ciclo in corso verrà completato prima dell\'arresto.',
  },
  {
    type: 'RESET',
    label: 'RESET',
    icon: 'pi pi-refresh',
    cssClass: 'cmd-reset',
    enabledStates: ['fault'],
    confirmMessage: 'Resettare la macchina in fault? Verificare e risolvere la causa del guasto prima di procedere.',
  },
  {
    type: 'EMERGENCY_STOP',
    label: 'ARRESTO DI EMERGENZA',
    icon: 'pi pi-exclamation-triangle',
    cssClass: 'cmd-emergency',
    enabledStates: ['running', 'stopped', 'fault'],
    confirmMessage: '⚠ ARRESTO DI EMERGENZA — La macchina si fermerà immediatamente. Confermare solo in caso di pericolo reale.',
  },
];

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ButtonModule],
  providers: [ConfirmationService],
  template: `
    <section class="control-panel" aria-label="Pannello comandi">
      <h2 class="control-panel__title">
        <i class="pi pi-sliders-h" aria-hidden="true"></i>
        Comandi Macchina
      </h2>

      <div class="control-panel__buttons">
        @for (cmd of commands; track cmd.type) {
          <button
            class="cmd-btn {{ cmd.cssClass }}"
            [disabled]="!isEnabled(cmd)"
            (click)="requestCommand(cmd)"
            [attr.aria-label]="cmd.label"
          >
            <i [class]="cmd.icon" aria-hidden="true"></i>
            <span>{{ cmd.label }}</span>
          </button>
        }
      </div>

      <div class="control-panel__hint">
        <i class="pi pi-info-circle" aria-hidden="true"></i>
        Ogni comando richiede doppia conferma
      </div>
    </section>

    <p-confirmDialog key="cmd-confirm" />
  `,
  styles: [`
    .control-panel {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 20px;
    }

    .control-panel__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 16px;
    }

    .control-panel__buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .cmd-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      min-height: 80px;
      border-radius: 6px;
      border: 2px solid transparent;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: opacity 150ms ease, transform 100ms ease, box-shadow 150ms ease;

      i {
        font-size: 22px;
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
        transform: none;
      }

      &:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      &:not(:disabled):active {
        transform: translateY(0);
      }
    }

    .cmd-start {
      background: color-mix(in srgb, var(--color-cmd-start) 20%, var(--color-bg-elevated));
      color: var(--color-cmd-start);
      border-color: var(--color-cmd-start);
    }

    .cmd-stop {
      background: color-mix(in srgb, var(--color-cmd-stop) 20%, var(--color-bg-elevated));
      color: var(--color-cmd-stop);
      border-color: var(--color-cmd-stop);
    }

    .cmd-reset {
      background: color-mix(in srgb, var(--color-cmd-reset) 20%, var(--color-bg-elevated));
      color: var(--color-cmd-reset);
      border-color: var(--color-cmd-reset);
    }

    .cmd-emergency {
      grid-column: 1 / -1;
      background: color-mix(in srgb, var(--color-cmd-emergency) 20%, var(--color-bg-elevated));
      color: var(--color-cmd-emergency);
      border-color: var(--color-cmd-emergency);
      min-height: 64px;
      flex-direction: row;

      i {
        font-size: 20px;
      }
    }

    .control-panel__hint {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }
  `],
})
export class ControlPanelComponent {
  machine = input.required<Machine>();
  commandRequest = output<CommandType>();

  private confirmationService = inject(ConfirmationService);

  commands = COMMANDS;

  isEnabled(cmd: CommandConfig): boolean {
    return cmd.enabledStates.includes(this.machine().status);
  }

  requestCommand(cmd: CommandConfig): void {
    this.confirmationService.confirm({
      key: 'cmd-confirm',
      message: cmd.confirmMessage,
      header: `Conferma: ${cmd.label}`,
      icon: cmd.type === 'EMERGENCY_STOP' ? 'pi pi-exclamation-triangle' : 'pi pi-question-circle',
      acceptLabel: 'Conferma',
      rejectLabel: 'Annulla',
      acceptButtonStyleClass: cmd.type === 'EMERGENCY_STOP' ? 'p-button-danger' : 'p-button-primary',
      accept: () => {
        this.commandRequest.emit(cmd.type);
      },
    });
  }
}
