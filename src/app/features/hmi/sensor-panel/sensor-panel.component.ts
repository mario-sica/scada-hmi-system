/**
 * @file sensor-panel.component.ts
 * @description Pannello con i 4 gauge sensore (temperatura, pressione, RPM, vibrazione)
 *              aggiornati in real-time tramite polling 5s.
 */

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorData } from '../../../core/models/sensor-data.model';
import { SensorGaugeComponent } from '../../../shared/components/sensor-gauge/sensor-gauge.component';

@Component({
  selector: 'app-sensor-panel',
  standalone: true,
  imports: [CommonModule, SensorGaugeComponent],
  template: `
    <section class="sensor-panel" aria-label="Pannello sensori">
      <h2 class="sensor-panel__title">
        <i class="pi pi-chart-line" aria-hidden="true"></i>
        Sensori — Real Time
      </h2>

      @if (sensorData()) {
        <div class="sensor-panel__grid">
          <app-sensor-gauge
            label="Temperatura"
            [value]="sensorData()!.temperature"
            unit="°C"
            sensorKey="temperature"
            [maxValue]="120"
          />
          <app-sensor-gauge
            label="Pressione"
            [value]="sensorData()!.pressure"
            unit="bar"
            sensorKey="pressure"
            [maxValue]="10"
          />
          <app-sensor-gauge
            label="Velocità"
            [value]="sensorData()!.rpm"
            unit="rpm"
            sensorKey="rpm"
            [maxValue]="2000"
          />
          <app-sensor-gauge
            label="Vibrazione"
            [value]="sensorData()!.vibration"
            unit="mm/s"
            sensorKey="vibration"
            [maxValue]="8"
          />
        </div>
        <div class="sensor-panel__timestamp">
          <i class="pi pi-clock" aria-hidden="true"></i>
          Ultimo aggiornamento: {{ sensorData()!.timestamp | date:'HH:mm:ss' }}
        </div>
      } @else {
        <div class="sensor-panel__loading">
          <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          Caricamento dati sensore...
        </div>
      }
    </section>
  `,
  styles: [`
    .sensor-panel {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 20px;
    }

    .sensor-panel__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 16px;
    }

    .sensor-panel__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .sensor-panel__timestamp {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    .sensor-panel__loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-secondary);
      padding: 24px 0;
    }
  `],
})
export class SensorPanelComponent {
  sensorData = input<SensorData | null>(null);
}
