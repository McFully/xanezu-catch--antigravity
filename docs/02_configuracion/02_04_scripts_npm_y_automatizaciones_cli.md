# SCRIPTS NPM Y AUTOMATIZACIONES CLI

## 1. COMANDOS REGISTRADOS
| Comando | Script Ejecutado |
| :--- | :--- |
| `npm run start` | `electron .` |
| `npm run ng` | `ng` |
| `npm run ng:start` | `ng serve --port 3000 --live-reload --poll 1000` |
| `npm run ng:build` | `ng build --base-href ./` |
| `npm run ng:watch` | `ng build --watch --configuration development` |
| `npm run dev` | `npm run ng:watch` |
| `npm run http-server` | `npx http-server . -p 3000 -o` |
| `npm run serve:web` | `http-server dist/xanezu-app/browser -p 3000 --cors -c-1` |
| `npm run electron:start` | `electron .` |
| `npm run dev:clean` | `rimraf .angular/cache && rimraf dist/` |
| `npm run build` | `npm run ng:build && electron-builder build --win && npm run build:installer` |
| `npm run build:installer` | `node scripts/build_setup.js` |
| `npm run test` | `node tests/logic.test.mjs` |
| `npm run fix:env` | `powershell -ExecutionPolicy Bypass -File scripts/fix_environment.ps1` |
