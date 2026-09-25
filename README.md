# Gingerbread Launcher

Una recreación del launcher de **Android 2.3 Gingerbread** para teléfonos actuales, hecha como proyecto web para [Bridge Launcher](https://github.com/bridgelauncher/launcher).

Bridge es una app de Android que usa una página web como pantalla de inicio y le da acceso a funciones del sistema (lista de apps, abrir apps, fondo de pantalla, barras del sistema…). Este repositorio es esa página web: está hecho con Vue 3, TypeScript y Vite, y no contiene código nativo de Android.

## Funciones

- **5 pantallas de inicio** que se recorren deslizando. Arranca en la del centro, y el botón de inicio de Android vuelve a ella.
- **Dock de Gingerbread**: Teléfono · Cajón de apps · Navegador. A los lados, los puntos indican cuántas pantallas quedan hacia cada lado; al tocarlos cambias de pantalla.
- **Cajón de apps**: cuadrícula de 4 columnas sobre fondo negro, con animación de zoom y botón de inicio para cerrarlo.
- **Escritorio editable**:
  - Mantén pulsada una app del cajón para arrastrarla al escritorio.
  - Mantén pulsado un icono o widget para moverlo. Si lo llevas al borde, pasa a la pantalla siguiente.
  - Durante el arrastre, el dock se convierte en una papelera para quitar elementos.
- **Carpetas**:
  - Arrastra apps encima de una carpeta para meterlas.
  - Tócala para abrirla y toca su título para cambiarle el nombre.
  - Desde una carpeta abierta puedes sacar apps arrastrándolas.
- **Widgets**: reloj analógico (2×2), reloj analógico grande (4×2) y el tiempo (4×1), con datos de [Open-Meteo](https://open-meteo.com/).
- **Fondo animado "Nexus"**: pulsos de luz de colores que recorren la pantalla. Al tocar un hueco vacío salen pulsos desde ese punto.
  - Se puede configurar la cantidad de pulsos, la velocidad y los fps (30, 60 o 120).
  - También puedes usar el fondo de pantalla del sistema.
- **Menú de opciones** (mantén pulsado un hueco vacío): Añadir, Fondo de pantalla, Apariencia, Notificaciones, Ajustes y Bridge.
- **Apariencia**:
  - Fondo de la barra de estado: transparente, degradado gris, degradado negro, blanco o negro.
  - Altura de la barra de estado: automática o manual.
  - Número de filas de la cuadrícula: automático según el alto de la pantalla, o de 4 a 7.
  - Mostrar u ocultar el botón flotante de Bridge.
- **Aspecto de Gingerbread**: tipografía Droid Sans, dock de cristal, sombra bajo los iconos y el naranja de Gingerbread al pulsar.

La configuración y el diseño del escritorio se guardan en el propio teléfono.

## Instalación en el teléfono

1. Instala [Bridge Launcher](https://github.com/bridgelauncher/launcher) y ponlo como launcher predeterminado.
2. Genera el build:
   ```bash
   npm install
   npm run build
   ```
3. Copia el **contenido** de la carpeta `dist/` a una carpeta del teléfono, por ejemplo `Projects/gingerbread-launcher`.
4. En los ajustes de Bridge, elige esa carpeta como *project dir*.

Si tienes el teléfono conectado con `adb`, los pasos 2 y 3 se hacen de una vez:

```bash
npm run deploy                       # copia a /sdcard/projects/gingerbread-launcher
npm run deploy -- /sdcard/otra/ruta  # u otra carpeta
```

**Recomendado:** en **Apariencia**, oculta el botón flotante de Bridge, que tapa el dock. En los ajustes de Bridge, ajusta el color de los iconos de la barra de estado según el fondo que elijas para ella.

## Desarrollo

```bash
npm run dev          # servidor de desarrollo en el navegador
npm run build        # comprobación de tipos + build en dist/
npm run type-check   # solo comprobación de tipos
npm run test:unit    # tests (Vitest) en modo watch
npx vitest run       # tests una sola vez
```

En el navegador, `window.Bridge` se reemplaza por un mock ([@bridgelauncher/api-mock](https://github.com/bridgelauncher/api)) con apps de ejemplo en `public/mock/`. Abrir una app muestra un `alert`. Para ver el diseño en tamaño de teléfono, usa la vista de dispositivo móvil de las herramientas de desarrollo. La pulsación larga se simula manteniendo pulsado el clic.

Las notas de arquitectura para trabajar en el código están en [CLAUDE.md](CLAUDE.md).

## Limitaciones

Vienen de lo que permite la API de Bridge (v0.1.0):

- **No hay widgets nativos de Android**: todos los widgets están hechos en HTML.
- **No se puede leer la música que suena** ni controlar otras apps (por eso no hay widget de música).
- **Teléfono y Navegador** abren la primera app instalada de una lista de apps conocidas, porque Bridge no indica cuáles son las predeterminadas.
- **Botón Atrás**: Bridge no avisa cuando se pulsa. El cajón intenta cerrarse con el historial del WebView, pero lo fiable es su botón de inicio o el botón de inicio de Android.
- **Barra de estado**: en algunos teléfonos Bridge informa mal su altura. Si el contenido queda debajo de ella, ajústala a mano en **Apariencia**.

## Créditos

Basado en [Bridge Launcher API Tester](https://github.com/bridgelauncher/api-tester) de Tored, bajo licencia MIT (ver [LICENSE](LICENSE)).

La tipografía Droid Sans viene del Android Open Source Project (android-2.3.7_r1), bajo licencia Apache 2.0 (ver [src/assets/fonts/NOTICE](src/assets/fonts/NOTICE)).

- [Bridge Launcher](https://github.com/bridgelauncher)
- [Tipos de la API y mock de desarrollo](https://github.com/bridgelauncher/api)
