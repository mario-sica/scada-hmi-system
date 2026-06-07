# SCADA HMI System

Sistema di monitoraggio e controllo industriale (HMI/SCADA) per macchinari PLC, costruito con Angular 22 e PrimeNG.

---

## Descrizione progetto

Applicazione web installata su **schermi industriali touch screen** in prossimità degli impianti. Permette agli operatori di:

- **Vista SCADA** (`/scada`): monitorare lo stato globale di 4 macchine industriali in una griglia 2×2 con aggiornamento real-time ogni 5 secondi.
- **Vista HMI** (`/hmi/:machineId`): controllare in dettaglio una singola macchina — visualizzazione sensori real-time, invio comandi (START/STOP/RESET/EMERGENZA), gestione allarmi con acknowledge.

L'accesso alla vista HMI è protetto da una password locale per macchina, che simula il gate operativo di sicurezza per prevenire azionamenti accidentali su schermi condivisi.

---

## Architettura

```
Angular App (SPA)
│
├── AppComponent              — Layout root: navbar globale + theme toggle
│   └── RouterOutlet
│       ├── /scada → ScadaDashboardComponent (lazy)
│       │   ├── AlarmBannerComponent          — Conteggio allarmi attivi
│       │   ├── MachineCardComponent × 4      — Griglia stato macchine
│       │   └── Dialog PrimeNG                — Password accesso HMI
│       │
│       └── /hmi/:machineId → HmiViewComponent (lazy, guard)
│           ├── Header HMI                    — Nome, status, back, connessione
│           ├── SensorPanelComponent          — 4 gauge real-time con soglie
│           ├── ControlPanelComponent         — START/STOP/RESET/EMERGENCY
│           └── AlarmLogComponent             — Tabella allarmi + acknowledge
│
├── Core
│   ├── Services              — MachineService, AlarmService, CommandService,
│   │                           AuthService, ThemeService
│   ├── Models                — Machine, SensorData, Alarm, ControlCommand
│   ├── Interceptors          — AuthInterceptor, ErrorInterceptor
│   ├── Guards                — HmiAccessGuard
│   └── Constants             — SENSOR_THRESHOLDS, MACHINE_PASSWORDS, API_ENDPOINTS
│
├── Shared
│   ├── Components            — StatusBadge, SensorGauge, AlarmBanner
│   └── Pipes                 — StatusLabelPipe, UnitFormatPipe
│
└── Styles
    ├── themes/_dark.scss     — CSS custom properties tema scuro
    ├── themes/_light.scss    — CSS custom properties tema chiaro
    ├── _variables.scss       — Variabili SCSS statiche
    ├── _typography.scss      — Font Inter + Roboto Mono
    └── _components.scss      — Override PrimeNG globali

HTTP Layer
Angular HttpClient → AuthInterceptor → ErrorInterceptor → JSON Server :3000
```

---

## Stack tecnologico

| Tecnologia | Versione | Motivazione |
|---|---|---|
| Angular | 22.0.0 | Standalone components, Signals, inject() — architettura enterprise moderna |
| PrimeNG | 21.1.9 | Libreria UI completa con design token system per theming industriale |
| Angular CDK | 22.0.0 | Dipendenza di PrimeNG, overlay e accessibility |
| RxJS | 7.8.x | Gestione polling real-time con `interval + switchMap` |
| JSON Server | 1.0.0-beta.15 | Mock REST API locale che simula il backend SCADA |
| TypeScript | 6.0.x | Type safety su tutti i modelli dati (Machine, SensorData, ecc.) |
| SCSS | - | CSS custom properties per il sistema di temi dark/light |
| PrimeIcons | 7.x | Iconografia coerente per UI industriale |

---

## Installazione e avvio

### Prerequisiti

- Node.js >= 22
- npm >= 11

### Setup

```bash
git clone <url-repository>
cd scada-hmi-system
npm install
```

### Avvio (richiede due terminali)

**Terminale 1 — Mock API (JSON Server):**
```bash
npm run mock-api
# JSON Server avviato su http://localhost:3000
# --delay 300 simula latenza di rete reale
```

**Terminale 2 — Applicazione Angular:**
```bash
npm start
# Angular dev server su http://localhost:4200
```

Aprire http://localhost:4200 — l'app reindirizza automaticamente a `/scada`.

### Build produzione

```bash
npm run build
# Output in dist/scada-hmi-system/
```

---

## Credenziali HMI

Le password sono configurate in `src/app/core/constants/passwords.ts`.

| Macchina | ID | Password |
|---|---|---|
| Linea Imbottigliamento A | M1 | `1234` |
| Pressa Idraulica B | M2 | `2345` |
| Nastro Trasportatore C | M3 | `3456` |
| Robot Saldatura D | M4 | `4567` |

> **Nota di sicurezza:** Le password sono locali al client — questo è un gate operativo, non un sistema di autenticazione reale. In produzione l'autenticazione avverrebbe tramite badge RFID o token centralizzato (IEC 62443).

---

## Struttura cartelle

```
scada-hmi-system/
├── db.json                         # Dati seed per JSON Server
├── src/
│   ├── app/
│   │   ├── app.ts                  # AppComponent con navbar e theme toggle
│   │   ├── app.config.ts           # ApplicationConfig con interceptors e providers
│   │   ├── app.routes.ts           # Routing lazy con HmiAccessGuard
│   │   │
│   │   ├── core/
│   │   │   ├── constants/
│   │   │   │   ├── api-endpoints.ts
│   │   │   │   ├── passwords.ts    # Password locali per gate operativo HMI
│   │   │   │   └── thresholds.ts   # Soglie warning/critical per sensori
│   │   │   ├── guards/
│   │   │   │   └── hmi-access.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts     # Header X-Operator-Session
│   │   │   │   └── error.interceptor.ts    # 404/5xx/network error handling
│   │   │   ├── models/
│   │   │   │   ├── alarm.model.ts
│   │   │   │   ├── api-response.model.ts
│   │   │   │   ├── control-command.model.ts
│   │   │   │   ├── machine.model.ts
│   │   │   │   └── sensor-data.model.ts
│   │   │   └── services/
│   │   │       ├── alarm.service.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── command.service.ts
│   │   │       ├── machine.service.ts      # Polling 5s via RxJS interval+switchMap
│   │   │       └── theme.service.ts        # Dark/light toggle con localStorage
│   │   │
│   │   ├── features/
│   │   │   ├── hmi/
│   │   │   │   ├── alarm-log/              # Tabella allarmi + acknowledge
│   │   │   │   ├── control-panel/          # START/STOP/RESET/EMERGENCY
│   │   │   │   ├── hmi-view/               # Vista HMI principale
│   │   │   │   └── sensor-panel/           # 4 gauge sensori real-time
│   │   │   └── scada/
│   │   │       ├── machine-card/           # Card macchina per griglia SCADA
│   │   │       └── scada-dashboard/        # Vista SCADA 2x2
│   │   │
│   │   └── shared/
│   │       ├── components/
│   │       │   ├── alarm-banner/           # Banner conteggio allarmi attivi
│   │       │   ├── sensor-gauge/           # Gauge valore sensore con threshold
│   │       │   └── status-badge/           # Badge stato operativo macchina
│   │       └── pipes/
│   │           ├── status-label.pipe.ts
│   │           └── unit-format.pipe.ts
│   │
│   ├── styles/
│   │   ├── themes/
│   │   │   ├── _dark.scss          # CSS custom properties tema scuro
│   │   │   └── _light.scss         # CSS custom properties tema chiaro
│   │   ├── _components.scss        # Override PrimeNG globali
│   │   ├── _typography.scss        # Inter + Roboto Mono
│   │   ├── _variables.scss         # Breakpoints, spacing, z-index
│   │   └── styles.scss             # Entry point
│   │
│   ├── index.html                  # data-theme="dark" default + anti-FOUC script
│   └── main.ts
│
└── package.json
```

---

## Gitflow

Il progetto segue il [Gitflow workflow](https://nvie.com/posts/a-successful-git-branching-model/):

```
main          — Release stabili taggati (v1.0.0, v1.1.0, ...)
develop       — Branch di integrazione continua
feature/*     — Feature branch (es. feature/scada-dashboard)
release/*     — Preparazione release (fix minori, version bump)
hotfix/*      — Fix critici su main
```

**Branch completati:**
- `feature/core-models-and-services` — Modelli, servizi, interceptors, guards
- `feature/json-server-setup` — db.json + script npm mock-api
- `feature/theme-system` — ThemeService + token SCSS dark/light
- `feature/shared-components` — StatusBadge, SensorGauge, AlarmBanner, Pipes
- `feature/scada-dashboard` — Vista SCADA 2x2
- `feature/hmi-view` — Vista HMI con sensori, comandi, allarmi

**Convenzione commit:** [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- `feat:` nuova funzionalita
- `fix:` bug fix
- `style:` modifiche SCSS/CSS
- `refactor:` modifica strutturale senza cambiare comportamento
- `chore:` configurazione, dipendenze

---

## Sistema di temi

L'applicazione supporta due temi commutabili tramite il pulsante nella navbar (icona sole/luna):

| Tema | Uso | Attivazione |
|---|---|---|
| **Dark** (default) | Schermi macchina 24/7, ambienti bui | `data-theme="dark"` su `<html>` |
| **Light** | Sale di controllo illuminate | `data-theme="light"` su `<html>` |

La preferenza e salvata in `localStorage` (chiave `hmi-theme`) e applicata prima del primo render tramite uno script inline in `index.html` (anti-FOUC).

---

## Riferimenti e Approfondimenti

### Angular
- [Angular Official Docs — Signals](https://angular.dev/guide/signals)
- [Angular Standalone Components](https://angular.dev/guide/components)
- [Angular HTTP Client](https://angular.dev/guide/http)
- [RxJS Official Docs](https://rxjs.dev/guide/overview)
- [RxJS interval + switchMap pattern](https://rxjs.dev/api/index/function/interval)

### PrimeNG
- [PrimeNG Angular Components](https://primeng.org/)
- [PrimeNG Theming (design tokens)](https://primeng.org/theming)
- [PrimeNG v4 Design Token Reference](https://primeng.org/theming#designtokens)

### CSS Custom Properties & Theming
- [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Theming con data-attribute pattern](https://css-tricks.com/a-complete-guide-to-dark-mode-on-the-web/)
- [WCAG contrasto colori AA](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### JSON Server
- [JSON Server GitHub](https://github.com/typicode/json-server)
- [REST mock rapido con JSON Server](https://www.freecodecamp.org/news/json-server-as-a-fake-rest-api-in-frontend-development/)

### SCADA / HMI / PLC — contesto industriale
- [ISA-101 HMI Design Standard](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa101)
- [OPC-UA (standard comunicazione PLC-Software)](https://opcfoundation.org/about/opc-technologies/opc-ua/)
- [Introduzione ai sistemi SCADA](https://inductiveautomation.com/resources/article/what-is-scada)
- [PLC Siemens S7-1500](https://www.siemens.com/global/en/products/automation/systems/industrial/plc/simatic-s7-1500.html)
- [Protocollo Modbus](https://modbus.org/docs/Modbus_Application_Protocol_V1_1b3.pdf)
- [MQTT per IIoT](https://mqtt.org/)

### Gitflow & Commit Convention
- [Gitflow originale (Nvie)](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits spec](https://www.conventionalcommits.org/en/v1.0.0/)

### Sicurezza HMI industriale
- [IEC 62443 — Cybersecurity per sistemi industriali](https://www.iec.ch/blog/iec-62443-cybersecurity-industrial-automation)
