import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * Preset industriale — mappa la nostra palette GitHub-dark/light
 * sui token surface di Aura. Aura gestisce struttura (padding, border-radius,
 * animazioni); noi gestiamo colori tramite i token colorScheme.
 *
 * Mapping surface dark:
 *   surface.0   → text-primary (#e6edf3)
 *   surface.400 → text-secondary (#8b949e)
 *   surface.500 → text-disabled (#484f58)
 *   surface.600 → border (#30363d)
 *   surface.700 → border/content-border (#30363d)
 *   surface.800 → bg-elevated (#21262d)
 *   surface.900 → bg-surface (#161b22)   ← content.background
 *   surface.950 → bg-base (#0d1117)      ← formField.background
 *
 * Mapping surface light:
 *   surface.0   → bg-base/bg-elevated (#ffffff)
 *   surface.200 → border (#d0d7de)       ← content.borderColor
 *   surface.500 → text-secondary (#636c76)
 *   surface.700 → text-primary (#1f2328) ← text.color
 *   surface.900 → bg-surface (#f6f8fa)   ← light content uses surface.0
 */
const IndustrialPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '8px',
    },
  },
  semantic: {
    colorScheme: {
      dark: {
        surface: {
          0:   '#e6edf3',
          50:  '#c9d1d9',
          100: '#b1bac4',
          200: '#8b949e',
          300: '#6e7681',
          400: '#8b949e',
          500: '#484f58',
          600: '#30363d',
          700: '#30363d',
          800: '#21262d',
          900: '#161b22',
          950: '#0d1117',
        },
        primary: {
          color: '#58a6ff',
          contrastColor: '#0d1117',
          hoverColor: '#79b8ff',
          activeColor: '#a8d1ff',
        },
      },
      light: {
        surface: {
          0:   '#ffffff',
          50:  '#f6f8fa',
          100: '#f6f8fa',
          200: '#d0d7de',
          300: '#afb8c1',
          400: '#afb8c1',
          500: '#636c76',
          600: '#57606a',
          700: '#1f2328',
          800: '#1f2328',
          900: '#f6f8fa',
          950: '#ffffff',
        },
        primary: {
          color: '#0969da',
          contrastColor: '#ffffff',
          hoverColor: '#0550ae',
          activeColor: '#033d8b',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    MessageService,
    providePrimeNG({
      theme: {
        preset: IndustrialPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          // cssLayer mette gli stili PrimeNG in @layer primeng (bassa priorità)
          // I nostri stili fuori dal layer sovrascrivono automaticamente
          cssLayer: {
            name: 'primeng',
            order: 'primeng',
          },
        },
      },
    }),
  ],
};
