# Gingerbread Launcher

Una recreación del launcher de **Android 2.3 Gingerbread** para teléfonos actuales, hecha como proyecto web para [Bridge Launcher](https://github.com/bridgelauncher/launcher).

Bridge es una app de Android que usa una página web como pantalla de inicio y le da acceso a funciones del sistema (lista de apps, abrir apps, fondo de pantalla, barras del sistema…). Este repositorio es esa página web: está hecho con Vue 3, TypeScript y Vite, y no contiene código nativo de Android.

<p align="center">
  <img src="docs/screenshot.png" alt="Pantalla de inicio: barra de estado de Gingerbread, reloj analógico grande, widget del tiempo, fondo Nexus y el dock" width="300">
</p>

## Funciones

- **5 pantallas de inicio** que se recorren deslizando. Arranca en la del centro, y el botón de inicio de Android vuelve a ella.
- **Dock de Gingerbread**: Teléfono · Cajón de apps · Navegador. A los lados, los puntos indican cuántas pantallas quedan hacia cada lado; al tocarlos cambias de pantalla.
- **Cajón de apps**: cuadrícula de 4 columnas sobre fondo negro, con animación de zoom y botón de inicio para cerrarlo. Su botón de lista abre **Administrar aplicaciones**, que lleva a la ficha de cada app en Android.
- **Escritorio editable**:
  - Mantén pulsada una app del cajón para arrastrarla al escritorio.
  - Mantén pulsado un icono o widget para moverlo. Si lo llevas al borde, pasa a la pantalla siguiente.
  - Durante el arrastre, el dock se convierte en una papelera: quita elementos del escritorio, y si la app viene del cajón, la **desinstala** (Android pide confirmación).
  - Al instalar una app, su icono se añade solo al escritorio, como hacía el Market (se puede desactivar).
- **Carpetas**:
  - Arrastra apps encima de una carpeta para meterlas.
  - Tócala para abrirla y toca su título para cambiarle el nombre.
  - Desde una carpeta abierta puedes sacar apps arrastrándolas.
- **Widgets**: reloj analógico (2×2), reloj analógico grande (4×2), reloj digital (4×1, con la fuente del reloj de Android 2.x), calendario del mes (4×2), batería (1×1), frase del día (4×1), el tiempo (4×1) con datos de [Open-Meteo](https://open-meteo.com/), **Control de energía** (4×1) con bloquear pantalla, modo noche, notificaciones y ajustes, y **Búsqueda de aplicaciones** (4×1): la barra de búsqueda de Gingerbread, que abre un buscador de apps instaladas (sin tildes ni mayúsculas, con las apps recientes).
- **Fondo animado "Nexus"**: pulsos de luz de colores que recorren la pantalla. Al tocar un hueco vacío salen pulsos desde ese punto.
  - Se puede configurar la cantidad de pulsos, la velocidad y los fps (30, 60 o 120).
  - También puedes usar el fondo de pantalla del sistema.
- **Menú de opciones** (mantén pulsado un hueco vacío): Añadir, Fondo de pantalla, Apariencia, Notificaciones, Ajustes y Bridge.
- **Apariencia**:
  - Barra de estado de Samsung o una **barra propia de Gingerbread**. La barra de Gingerbread muestra la hora y la batería reales. La señal y el Wi-Fi son simulados: suben y bajan poco a poco y tienen flechas de actividad, pero no reflejan la intensidad real. No muestra notificaciones; se toca la barra para abrirlas.
  - Fondo de la barra de estado: transparente, degradado gris, degradado negro, blanco o negro.
  - Altura de la barra de estado: automática o manual.
  - Número de filas de la cuadrícula: automático según el alto de la pantalla, o de 4 a 7.
  - Mostrar u ocultar el botón flotante de Bridge.
  - **Brillo naranja** de Gingerbread al llegar al final de una lista, o el efecto de Android.
  - Añadir o no el icono de las apps que instalas.
- **Aspecto de Gingerbread**: tipografía Droid Sans (y Clockopia en el reloj digital), dock de cristal, sombra bajo los iconos y el naranja de Gingerbread al pulsar.

La configuración y el diseño del escritorio se guardan en el propio teléfono.

## Instalación en el teléfono

1. Instala [Bridge Launcher](https://github.com/bridgelauncher/launcher) y ponlo como launcher predeterminado.
2. Descarga el proyecto y genera el build:
   ```bash
   git clone https://github.com/njpd57/gingerbread-bridge-launcher
   cd gingerbread-bridge-launcher
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

Para activar el botón del modo noche, mira [Permisos opcionales](#permisos-opcionales).

**Recomendado:** en **Apariencia**, oculta el botón flotante de Bridge, que tapa el dock. En los ajustes de Bridge, ajusta el color de los iconos de la barra de estado según el fondo que elijas para ella.

## Permisos opcionales

Algunas funciones necesitan permisos que Bridge no pide por sí solo. Sin ellos el launcher funciona igual, pero esos botones del widget **Control de energía** se ven apagados y, al tocarlos, explican qué falta.

| Función | Qué hace falta | Cómo |
|---|---|---|
| **Modo noche** (botón de la luna) | Permiso `WRITE_SECURE_SETTINGS` para Bridge | Con el teléfono conectado por adb (depuración USB activada): `npm run grant-permissions`, o a mano: `adb shell pm grant com.tored.bridgelauncher android.permission.WRITE_SECURE_SETTINGS` |
| **Notificaciones reales** en la barra de estado Gingerbread | Nuestro [fork de Bridge](https://github.com/njpd57/bridge-launcher) y el acceso a notificaciones | En **Apariencia**, con la barra Gingerbread elegida, toca "Mostrar notificaciones reales" y activa Bridge en la pantalla que se abre. Sin el acceso, los iconos de notificaciones son decorativos |
| **Brillo y rotación** en el panel de notificaciones | Nuestro fork de Bridge y el permiso "Modificar ajustes del sistema" | Al tocar esos botones por primera vez se abre la pantalla del permiso: activa Bridge. Linterna y sincronización no necesitan permiso. Wi-Fi y Bluetooth solo abren el panel de Android, porque las apps ya no pueden cambiarlos |
| **Bloquear pantalla** (botón del candado) | El servicio de accesibilidad de Bridge y permitir el bloqueo | En Android: *Ajustes → Accesibilidad → Bridge* (activar), y en los ajustes de Bridge, permitir que el proyecto bloquee la pantalla. Después de bloquear así, se desbloquea con PIN o patrón, no con huella |

Sobre el permiso del modo noche:
- **Basta con darlo una vez.** Se mantiene al reiniciar el teléfono y al actualizar Bridge, pero **se pierde si desinstalas y vuelves a instalar Bridge**.
- No hace falta reiniciar nada: el launcher vuelve a comprobar los permisos cada vez que vuelves a él.
- Para comprobar si está dado: `adb shell dumpsys package com.tored.bridgelauncher | grep "WRITE_SECURE_SETTINGS: granted"` debe mostrar `granted=true`.
- Algunas versiones de Bridge (como la 0.1.0alpha) no pueden comprobar este permiso. En ese caso el launcher intenta el cambio igualmente y, si falta el permiso, Bridge muestra un aviso.

## Desarrollo

```bash
npm run dev          # servidor de desarrollo en el navegador
npm run build        # comprobación de tipos + build en dist/
npm run type-check   # solo comprobación de tipos
npm run test:unit    # tests (Vitest) en modo watch
npx vitest run       # tests una sola vez
```

El desarrollo se hace en la rama **`dev`**. Si tienes otros *worktrees* de git dentro de `.claude/`, Vitest también encuentra sus tests; para ejecutar solo los de este proyecto usa `npx vitest run --dir src`.

En el navegador, `window.Bridge` se reemplaza por un mock ([@bridgelauncher/api-mock](https://github.com/bridgelauncher/api)) con apps de ejemplo en `public/mock/`. Abrir una app muestra un `alert`. Para ver el diseño en tamaño de teléfono, usa la vista de dispositivo móvil de las herramientas de desarrollo. La pulsación larga se simula manteniendo pulsado el clic.

Las notas de arquitectura para trabajar en el código están en [CLAUDE.md](CLAUDE.md).

## Limitaciones

Vienen de lo que permite la API de Bridge (v0.1.0):

- **No hay widgets nativos de Android**: todos los widgets están hechos en HTML.
- **No se puede leer la música que suena** ni controlar otras apps (por eso no hay widget de música).
- **Teléfono y Navegador** abren la primera app instalada de una lista de apps conocidas, porque Bridge no indica cuáles son las predeterminadas.
- **Botón Atrás**: Bridge no avisa cuando se pulsa. El cajón y la búsqueda se cierran con Atrás gracias al historial del WebView (comprobado en un Galaxy Z Flip5), y también con su botón de casa o el botón de inicio de Android.
- **Modo horizontal**: el launcher no puede impedir que la pantalla gire; eso lo decide Bridge. Intenta bloquearse en vertical, aunque es probable que el WebView no lo permita. Aun así, al girar **no se desordenan los iconos**: en horizontal se mantienen las filas de vertical. Si no quieres que gire nunca, desactiva la rotación automática en el panel rápido de Android.
- **Barra de estado**: en algunos teléfonos Bridge informa mal su altura. Si el contenido queda debajo de ella, ajústala a mano en **Apariencia**.

## Créditos

Basado en [Bridge Launcher API Tester](https://github.com/bridgelauncher/api-tester) de Tored, bajo licencia MIT (ver [LICENSE](LICENSE)).

Las tipografías Droid Sans y Clockopia vienen del Android Open Source Project (android-2.3.7_r1), bajo licencia Apache 2.0 (ver [src/assets/fonts/NOTICE](src/assets/fonts/NOTICE)).

- [Bridge Launcher](https://github.com/bridgelauncher)
- [Tipos de la API y mock de desarrollo](https://github.com/bridgelauncher/api)
