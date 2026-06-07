/**
 * @file theme.service.ts
 * @description Gestisce il tema visivo dell'applicazione (dark / light).
 *              Il tema viene applicato aggiungendo/rimuovendo l'attributo
 *              [data-theme="dark"] | [data-theme="light"] sul <html> root element.
 *              Tutti i CSS custom properties (colori, sfondi, testi) sono definiti
 *              in styles/themes/_dark.scss e styles/themes/_light.scss e vengono
 *              attivati tramite questo attributo — zero JavaScript nel CSS.
 *
 * @rationale
 *              In ambienti industriali il tema scuro è preferito su schermi 24/7
 *              (riduce affaticamento, migliore leggibilità in ambienti bui).
 *              Il tema chiaro è utile in sale di controllo illuminate o per
 *              supervisori che leggono report. Lo switch deve essere immediato
 *              e persistente tra le sessioni.
 *
 * @persistence localStorage: chiave 'hmi-theme' → 'dark' | 'light'
 *              Al bootstrap dell'app, AppComponent legge questa preferenza e
 *              applica il tema prima del primo render (niente flash of wrong theme).
 */

import { Injectable, signal, Signal, DOCUMENT, inject } from '@angular/core';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'hmi-theme';
const DEFAULT_THEME: AppTheme = 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);
  private _isDark = signal<boolean>(true);

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    this.applyTheme(saved ?? DEFAULT_THEME);
  }

  /** @returns Il tema attualmente attivo */
  getCurrentTheme(): AppTheme {
    return this._isDark() ? 'dark' : 'light';
  }

  /** Signal reattivo per il binding nei template Angular */
  isDark(): Signal<boolean> {
    return this._isDark.asReadonly();
  }

  /** Alterna tra dark e light theme */
  toggleTheme(): void {
    this.setTheme(this._isDark() ? 'light' : 'dark');
  }

  /**
   * Applica il tema specificato immediatamente.
   * @param theme - 'dark' | 'light'
   */
  setTheme(theme: AppTheme): void {
    this.applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private applyTheme(theme: AppTheme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this._isDark.set(theme === 'dark');
  }
}
