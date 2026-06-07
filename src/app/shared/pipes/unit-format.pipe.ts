import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'unitFormat', standalone: true })
export class UnitFormatPipe implements PipeTransform {
  /**
   * Formatta un valore numerico con la sua unità di misura.
   * @param value - Il valore numerico
   * @param unit - L'unità di misura (es. '°C', 'bar', 'rpm', 'mm/s')
   * @param decimals - Numero di decimali (default: 1)
   */
  transform(value: number, unit: string, decimals = 1): string {
    if (value == null || isNaN(value)) return '—';
    return `${value.toFixed(decimals)} ${unit}`;
  }
}
