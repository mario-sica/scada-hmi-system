import { Pipe, PipeTransform } from '@angular/core';
import { MachineStatus } from '../../core/models/machine.model';

const LABELS: Record<MachineStatus, string> = {
  running: 'In marcia',
  stopped: 'Fermo',
  fault: 'Guasto',
  maintenance: 'Manutenzione',
};

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(status: MachineStatus): string {
    return LABELS[status] ?? status;
  }
}
