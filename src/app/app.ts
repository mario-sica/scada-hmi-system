/**
 * @file app.ts
 * @description Componente root dell'applicazione HMI/SCADA.
 *              Gestisce il layout globale (navbar con toggle tema) e il router outlet.
 *              Applica il tema salvato in localStorage prima del primo render.
 */

import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToastModule, TooltipModule, ButtonModule],
  template: `
    <p-toast position="top-center" [baseZIndex]="9999" />

    <nav class="app-navbar" aria-label="Barra di navigazione principale">
      <div class="app-navbar__brand">
        <i class="pi pi-desktop" aria-hidden="true"></i>
        <span class="app-navbar__title">SCADA HMI System</span>
        <span class="app-navbar__version">v1.0</span>
      </div>

      <div class="app-navbar__actions">
        <button
          class="theme-toggle"
          (click)="themeService.toggleTheme()"
          [attr.aria-label]="themeToggleAriaLabel()"
          [pTooltip]="themeToggleTooltip()"
          tooltipPosition="bottom"
        >
          @if (themeService.isDark()) {
            <i class="pi pi-sun" aria-hidden="true"></i>
          } @else {
            <i class="pi pi-moon" aria-hidden="true"></i>
          }
        </button>
      </div>
    </nav>

    <main class="app-content" role="main">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      height: 60px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 100;
      flex-shrink: 0;
    }

    .app-navbar__brand {
      display: flex;
      align-items: center;
      gap: 10px;

      i {
        font-size: 20px;
        color: var(--color-border-focus);
      }
    }

    .app-navbar__title {
      font-size: 17px;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: 0.02em;
    }

    .app-navbar__version {
      font-size: 13px;
      color: var(--color-text-secondary);
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      padding: 2px 7px;
      border-radius: 3px;
      font-family: 'Roboto Mono', monospace;
    }

    .app-navbar__actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      cursor: pointer;
      color: var(--color-text-primary);
      font-size: 18px;
      transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;

      &:hover {
        background: var(--color-bg-overlay);
        border-color: var(--color-border-focus);
        color: var(--color-border-focus);
      }

      &:focus-visible {
        outline: 2px solid var(--color-border-focus);
        outline-offset: 2px;
      }
    }

    .app-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class App implements OnInit {
  protected themeService = inject(ThemeService);

  themeToggleAriaLabel = computed(() =>
    this.themeService.isDark() ? 'Passa a tema chiaro' : 'Passa a tema scuro'
  );

  themeToggleTooltip = computed(() =>
    this.themeService.isDark() ? 'Passa a tema chiaro' : 'Passa a tema scuro'
  );

  ngOnInit(): void {
    // Il ThemeService applica il tema nel costruttore, qui forziamo il data-theme
    // sull'elemento <html> come fallback di sicurezza per evitare FOUC
    const saved = localStorage.getItem('hmi-theme') ?? 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }
}
