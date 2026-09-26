# Funciones posibles con la API de Bridge

**Estado:** las ideas 1 a 7, 9, 12, 15, 16, 20, 25, 26 y 28 a 33 ya están implementadas (marcadas con ✅). Las ideas 8, 10 y 11 quedan para más adelante (marcadas con ⏬ Baja prioridad). Las ideas 1 a 5 están probadas en un Samsung Galaxy Z Flip5 con Bridge 0.1.0alpha. Con nuestro fork de Bridge están probadas en el teléfono la 5 (con el estado de Wi-Fi, Bluetooth y GPS), la 7 (con la búsqueda web), la 16 (con eventos), la 25 y de la 30 a la 33. Los widgets 15, 20, 26 y 28 y las ideas 6 y 9 todavía no se han probado en el teléfono; la 12 y la 29 sí. La 25 y de la 30 a la 33 necesitan nuestro fork.

Revisión de todo lo que ofrece `@bridgelauncher/api` v0.1.0 (la última publicada), qué usa ya el launcher y qué se podría agregar. Las ideas van ordenadas por lo bien que encajan con Gingerbread y por el esfuerzo que requieren.

## Qué usamos y qué no

| Área | Ya se usa | Sin usar |
|---|---|---|
| Apps | `getAppsURL`, `getDefaultAppIconURL`, `requestLaunchApp`, `requestAppUninstall`, `requestOpenAppInfo`, eventos `appInstalled` / `appChanged` / `appRemoved` | — |
| Fondo de pantalla | `setWallpaperOffsetSteps`, `setWallpaperOffsets`, `requestChangeSystemWallpaper`, dibujar el fondo del sistema detrás del WebView | `sendWallpaperTap` |
| Barras del sistema | Apariencia de la barra de estado (incluido ocultarla), insets de barras, del recorte de la cámara y del teclado (`getImeWindowInsets`) | Gestos (`systemGestures`, `mandatorySystemGestures`), `tappableElement`, `captionBar`, `waterfall`, `getDisplayCutoutPath`, `getDisplayShapePath` |
| Ajustes de Bridge | Botón flotante, efectos de overscroll, "dibujar el fondo del sistema detrás del WebView", modo noche del sistema (`requestSetSystemNightMode`) | Tema de Bridge |
| Sistema | `requestExpandNotificationShade`, `requestOpenAndroidSettings`, `requestOpenBridgeSettings`, `requestLockScreen` / `getCanLockScreen`, `showToast` | `requestOpenDeveloperConsole`, `requestOpenBridgeAppDrawer`, `getLastErrorMessage` |
| Información | — | `getAndroidAPILevel`, `getBridgeVersionName`, `getBridgeVersionCode`, `getProjectURL` |
| Ciclo de vida | `newIntent` (botón de inicio), `beforePause`, `afterResume` | — |
| Solo en nuestro fork de Bridge | `requestSetScreenOrientation` (vertical fija), `getDefaultAppPackageName` (dock), `requestOpenUrl` (búsqueda web), notificaciones (`getNotificationsURL`, `getNotificationIconURL`, `requestOpenNotification`, `requestDismissNotification` y sus eventos: iconos reales en la barra de estado y panel de notificaciones propio), ajustes rápidos (linterna, brillo, rotación, sincronización y `requestOpenSystemPanel` para Wi-Fi, Bluetooth y GPS; también en el widget Control de energía), música (`getMediaSession`, `requestMediaAction`: widget "Música" y reproductor en el panel), calendario (`getCalendarEventsURL`, `requestOpenCalendarEvent`, `requestOpenCalendarAt`: widget Agenda y eventos en el calendario del mes), estado de Wi-Fi, Bluetooth y GPS (`getWifiEnabled`, `getBluetoothEnabled`, `getLocationEnabled`), señal real (`getConnectivity`: barras, Wi-Fi y flechas de datos en la barra Gingerbread), accesos directos de apps (`getAppShortcutsURL`, `requestStartAppShortcut`), selector de archivos para `<input type="file">` (marco de fotos) | `getScreenOrientation`, evento `screenOrientationChanged` |

Los **packs de iconos** (`getIconPacksURL`, `getAppIconURL`…) aparecen en la API como borrador, comentados: todavía no existen en Bridge.

Nuestro [fork de Bridge](https://github.com/njpd57/bridge-launcher) añade métodos que la API publicada no tiene. Se declaran en `src/types/bridge-fork.d.ts` y el launcher los usa solo si existen, así que sigue funcionando con el Bridge original.

**Ojo:** el Bridge instalado puede no tener todos los métodos de la API. Bridge 0.1.0alpha no tiene `getCanRequestSystemNightMode()`; por eso los métodos opcionales se comprueban con `bridgeHas()` antes de llamarlos.

---

## Ideas muy de Gingerbread

### 1. Desinstalar arrastrando a la papelera ✅ Hecho
En Gingerbread, arrastrar una app **desde el cajón** hasta la papelera abría el diálogo de desinstalación. Ahora nuestro launcher hace lo mismo: la papelera dice "Desinstalar" cuando la app viene del cajón.
- **API:** `requestAppUninstall(packageName)`. Android pide confirmación y, si se desinstala, el evento `appRemoved` ya limpia el escritorio.
- **Esfuerzo:** bajo. Es un caso más en `applyDrop()` de `useDragStore`, y un icono de papelera distinto ("Desinstalar") cuando el arrastre viene del cajón.

### 2. "Administrar aplicaciones" e información de la app ✅ Hecho
El cajón de Gingerbread tenía "Administrar aplicaciones". Está hecho como un botón en la barra inferior del cajón, que abre la lista de apps; al tocar una se abre su ficha en Android.
- **API:** `requestOpenAppInfo(packageName)` y `requestOpenAndroidSettings()`.
- **Esfuerzo:** bajo.

### 3. Brillo naranja de overscroll ✅ Hecho
**El brillo naranja al llegar al final de una lista se estrenó justo en Gingerbread.** Bridge permite desactivar el efecto moderno de Android (el estiramiento) para dibujar el nuestro: un brillo naranja en el borde del cajón al llegar arriba o abajo, y en los extremos del escritorio al pasar de la primera o la última página.
- **API:** `requestSetOverscrollEffects('none')` y el evento `overscrollEffectsChanged`.
- **Esfuerzo:** medio. Hay que detectar el "tirón" en el borde y dibujar el brillo con un degradado.

### 4. Añadir el icono al instalar una app ✅ Hecho
El Market de la época agregaba el icono al escritorio al instalar una app. Está hecho, con una opción en Apariencia: *"Al instalar una aplicación: Añadir icono / No añadir"*.
- **API:** el evento `appInstalled`, que ya se recibe, más `findFreeSpot()` del store del escritorio.
- **Esfuerzo:** bajo.

### 5. Widget "Control de energía" ✅ Hecho
Imitar el widget clásico de 4×1 con lo que Bridge **sí** puede hacer:
  - **Bloquear pantalla** (`requestLockScreen`).
  - **Modo noche** (`requestSetSystemNightMode`). Requiere dar un permiso a Bridge una sola vez por adb: `adb shell pm grant com.tored.bridgelauncher android.permission.WRITE_SECURE_SETTINGS`.
  - **Notificaciones** (`requestExpandNotificationShade`).
  - **Ajustes** (`requestOpenAndroidSettings`).
- Cada botón se desactiva si no hay permiso, según `getCanLockScreen()` y `getCanRequestSystemNightMode()`, y reacciona a sus eventos `canLockScreenChanged` y `canRequestSystemNightModeChanged`.
- **Con nuestro fork de Bridge** el widget pasa a los 5 botones del original de Android 2.3: **Wi-Fi, Bluetooth, GPS, sincronización y brillo**. Bloquear y modo noche siguen ahí con una pulsación larga: sobre el brillo cambia el modo noche y sobre la sincronización bloquea la pantalla (esos dos botones ya no sirven para mover el widget; los otros tres sí). Sincronización y brillo cambian de verdad; Wi-Fi, Bluetooth y GPS solo abren el panel de Android (`requestOpenSystemPanel`), porque las apps ya no pueden cambiarlos, pero **muestran su estado** (`getWifiEnabled`, `getBluetoothEnabled`, `getLocationEnabled` y sus eventos). El panel de notificaciones también tiene un botón GPS.
- **Esfuerzo:** medio. Aprovecha lo que ya existe para añadir widgets.

> Para el botón del modo noche hay que conceder el permiso una vez con `npm run grant-permissions` (ver "Permisos opcionales" en el README). Bridge 0.1.0alpha no tiene `getCanRequestSystemNightMode()`, así que el launcher intenta el cambio sin poder comprobar el permiso antes. Los permisos se vuelven a leer al volver al launcher, porque darlos por adb no genera ningún evento.

### 6. Toques al fondo animado del sistema ✅ Hecho
Si el usuario elige como fondo del sistema un fondo **animado** (live wallpaper), esos fondos reaccionan a los toques. Eso también era típico de Gingerbread, por ejemplo con el fondo "Nexus" real.
- **API:** `sendWallpaperTap(x, y)` al tocar un hueco vacío cuando el fondo es "Fondo del sistema" (`onWorkspaceClick` en `App.vue`); con nuestro fondo Nexus, el toque sigue generando pulsos. Bridge convierte las coordenadas CSS a píxeles de pantalla.
- **Esfuerzo:** muy bajo.

### 7. Widget de búsqueda de aplicaciones ✅ Hecho
Gingerbread traía de serie el widget de búsqueda de Google: una barra de 4×1 con el logo de Google, un campo de texto y el botón del micrófono. Nuestra versión tiene el mismo aspecto, pero busca **aplicaciones instaladas**; con nuestro fork de Bridge también ofrece la búsqueda web.
- Al tocar la barra se abre un panel de búsqueda a pantalla completa, al estilo de la búsqueda rápida de Gingerbread: el campo arriba con el teclado abierto y, debajo, la lista de resultados con icono y nombre, que se filtra mientras se escribe.
- La búsqueda ignora mayúsculas y tildes ("camara" encuentra "Cámara"), pone primero los nombres que empiezan por el texto y después los que lo contienen. Si hay una sola coincidencia, "Intro" en el teclado la abre.
- Se podrían mostrar las **apps usadas hace poco** cuando el campo está vacío, guardadas en localStorage, como hacía la búsqueda rápida.
- El logo de Google se sustituye por una lupa o un texto propio ("Buscar aplicaciones"), para no usar la marca.
- **API:** la lista de apps que ya carga el cajón (`getAppsURL`) y `requestLaunchApp(packageName)`. El panel se cierra con el botón de inicio (`newIntent`, a través de `useMenuStore`) y con el truco de `history.pushState` que ya usa el cajón para el botón Atrás.
- **Búsqueda web (solo con nuestro fork):** al final de los resultados aparece "Buscar «…» en la web", que abre Google con `requestOpenUrl`. "Intro" también busca en la web cuando no hay exactamente una coincidencia.
- **Limitaciones:** con el Bridge original no hay búsqueda web (no abre URLs). Tampoco hay búsqueda por voz (el WebView de Android no soporta `SpeechRecognition`), así que el botón del micrófono se omite o solo enfoca el campo. Tampoco se puede responder a la tecla física de búsqueda de los teléfonos de la época.
- **Filtrar con cada letra.** En el teléfono los resultados solo se actualizaban al pulsar espacio: el teclado de Android va "componiendo" cada palabra (la que subraya con sugerencias) y el `v-model` de Vue no actualiza el valor hasta que termina la composición. El campo de `SearchPanel.vue` usa `:value` más `@input`, porque el evento `input` llega con cada letra (probado en el teléfono).
- **Esfuerzo:** medio. Está hecho en `src/widgets/search/`, con la búsqueda en `src/utils/search.ts`. Las apps recientes salen de `useAppLauncherStore`, por donde pasan todos los lanzamientos, y el panel usa `useKeyboardInset()` para que el teclado no tape los resultados.

---

## Mejoras de uso

### 8. Doble toque para bloquear la pantalla ⏬ Baja prioridad
No existía en Gingerbread, pero es muy práctico. Sería opcional en Apariencia.
- **API:** `requestLockScreen()` y `getCanLockScreen()`. Requiere activar el servicio de accesibilidad de Bridge y permitir el bloqueo en sus ajustes. En Android 9 y posteriores, después de bloquear así hay que desbloquear con el PIN, no con la huella; Bridge lo advierte en su documentación.
- **Esfuerzo:** bajo.

### 9. Que el teclado no tape los campos ✅ Hecho
Al escribir la ciudad del tiempo o renombrar una carpeta, el teclado puede tapar el campo.
- **API:** `getImeWindowInsets()` y el evento `imeWindowInsetsChanged`, para subir el contenido lo que ocupa el teclado.
- El composable `useKeyboardInset()` combina la altura del teclado que da Bridge con lo que el WebView ya se encogió. Lo usan el panel de búsqueda, **`GbDialog`** (todos los diálogos se recentran sobre el teclado) y la carpeta abierta mientras se renombra.
- La ciudad del tiempo ya no se escribe dentro del widget, que puede estar abajo en el escritorio, sino en un diálogo "Ciudad del tiempo".
- Mientras hay un campo con el foco, `App.vue` no recalcula las filas automáticas: si el teclado encogiera el WebView, menos filas moverían los iconos para siempre.
- Las futuras nota adhesiva (21) y lista de tareas (24) pueden escribir en un `GbDialog` para aprovecharlo.
- **Esfuerzo:** bajo.

### 10. Cambio de página por el borde sin chocar con el gesto "Atrás" ⏬ Baja prioridad
Al arrastrar un icono al borde para pasar de página, esa zona coincide con el gesto de volver atrás de Android.
- **API:** `getSystemGesturesWindowInsets()` y `getMandatorySystemGesturesWindowInsets()`, para usar esa zona como referencia en `EDGE_PX` (`useDragStore`).
- **Esfuerzo:** bajo.

### 11. Esquivar la cámara con precisión ⏬ Baja prioridad
La barra de Gingerbread deja el centro libre "a ojo". Con la forma real del recorte se puede reservar justo ese espacio y colocar las notificaciones y los iconos a su alrededor.
- **API:** `getDisplayCutoutPath()` (Android 12+) y `getDisplayShapePath()` (Android 14+, esquinas redondeadas de la pantalla). Ambas devuelven un path SVG.
- **Esfuerzo:** medio.

### 29. Tamaño de los iconos ✅ Hecho
Un deslizante en **Apariencia → Tamaño de los iconos**, de 75 % a 130 % del tamaño de Gingerbread (48 px), con un botón "Normal" para volver al 100 %.
- Se guarda en `useSettingsStore` (`settings.iconScale`). `App.vue` lo convierte en dos variables CSS en `.launcher-root`: `--icon-size` para el escritorio, las carpetas y el icono que se arrastra (`Shortcut.vue`), y `--drawer-icon-size` para el cajón (`AppDrawer.vue`).
- En el escritorio el icono nunca crece más de lo que cabe en su celda con la etiqueta (`fittedIconSize()` en `src/utils/iconSize.ts`), así que con 7 filas en pantallas bajas puede quedar más chico que lo elegido. El cajón no tiene ese límite.
- El texto de debajo y el dock no cambian: el dock es una barra de altura fija.
- **API:** ninguna; es solo CSS y un ajuste guardado.
- **Esfuerzo:** bajo.

---

## Herramientas y mantenimiento

### 12. Pantalla "Acerca de" y diagnóstico ✅ Hecho
Un botón al final de **Apariencia** abre "Acerca de y diagnóstico" (`src/menu/AboutDialog.vue`), que muestra:
- **Versiones:** la compilación del launcher (commit y si tenía cambios sin commit, inyectados por `vite.config.ts` como `__BUILD_INFO__`), la de Bridge (`getBridgeVersionName` / `getBridgeVersionCode`, y si es nuestro fork) y la de Android (`getAndroidAPILevel`).
- **Pantalla:** tamaño de la ventana, densidad, filas y tamaño de celda.
- **Los insets que informa Bridge, en vivo,** y las alturas que el launcher usa de verdad para las barras y el teclado.
- **Permisos:** bloqueo, modo noche, notificaciones, calendario y ajustes del sistema.
- El **último error** de la API (`getLastErrorMessage`) y los **últimos 30 eventos** de Bridge (los guarda `useBridgeEventStore`).
- Un botón para abrir la **consola de desarrollo** de Bridge (`requestOpenDeveloperConsole`).
- **Ya sirvió:** al abrirla por primera vez mostró que Bridge intercambia arriba e izquierda en todos los insets (ver "Fallos de Bridge" más abajo).

### 13. Detectar funciones según la versión
Usar `getAndroidAPILevel()` para ocultar las opciones que el teléfono no soporta. Por ejemplo, la forma del recorte solo existe desde Android 12, y el modo noche "personalizado" desde Android 11.
- **Esfuerzo:** bajo, y se hace junto con las funciones que lo necesiten.

### 14. Errores con el estilo del launcher
Hoy, cuando algo falla, Bridge muestra su propio aviso (`showToastIfFailed`). Se podría pasar `false` y mostrar el error con un aviso al estilo Gingerbread, usando `getLastErrorMessage()` para el texto.
- **Esfuerzo:** bajo.

---

## Widgets nuevos

Todos son HTML y usan solo APIs web, localStorage o servicios gratuitos sin clave, así que no dependen de Bridge. Cada uno se añade en tres sitios: `WidgetKind`/`WIDGET_SIZES`, `WidgetView.vue` y `AddDialog.vue`. El widget de búsqueda está en la idea 7.

### 15. Reloj digital ✅ Hecho
Hora grande con la fecha debajo, con la tipografía y el estilo de la pantalla de bloqueo de Gingerbread. Complementa al reloj analógico que ya existe.
- **Tamaño:** 4×1 (y quizá una versión 2×1).
- **Esfuerzo:** muy bajo.

### 16. Calendario del mes ✅ Hecho
La cuadrícula del mes actual con el día de hoy resaltado en naranja y flechas para cambiar de mes.
- **Con nuestro fork de Bridge** y el permiso de calendario, los días con eventos llevan puntos del color de su calendario (hasta 3), y al tocar un día se abre la app de calendario en esa fecha (`requestOpenCalendarAt`). Con el Bridge original no muestra eventos, porque su API no puede leer el calendario.
- **Tamaño:** 4×2 o 4×3.
- **Esfuerzo:** bajo. Los nombres de meses y días salen de `Intl.DateTimeFormat('es')`.

### 17. Cuenta regresiva
Los días que faltan para una fecha elegida (un cumpleaños, un viaje), con un título. Se configura al añadirlo, con un diálogo `GbDialog`.
- **Tamaño:** 2×1.
- **Esfuerzo:** bajo. Cada instancia necesita guardar su propia configuración, lo que sirve de base para otros widgets configurables.

### 18. Pronóstico extendido
El tiempo de los próximos 4 o 5 días (icono, máxima y mínima), con la misma ciudad que el widget del tiempo.
- **API:** Open-Meteo, pidiendo `forecast_days` > 1 en `useWeatherStore` (hoy pide 1).
- **Tamaño:** 4×2.
- **Esfuerzo:** bajo.

### 19. Sol y luna
La hora de salida y puesta del sol y la fase lunar, con un dibujo de la luna.
- **API:** `sunrise`/`sunset` de Open-Meteo, en la misma petición del tiempo. La fase lunar se calcula localmente a partir de la fecha.
- **Tamaño:** 2×1.
- **Esfuerzo:** bajo.

### 20. Batería ✅ Hecho
El porcentaje y un icono de batería al estilo Gingerbread (verde, amarillo o rojo, y el rayo cuando está cargando).
- **API:** la Battery API, a través de `useDeviceStatus`, que ya usa la barra de estado.
- **Tamaño:** 1×1.
- **Esfuerzo:** muy bajo.

### 21. Nota adhesiva
Una nota amarilla con texto que se edita al tocarla y se guarda en localStorage.
- **Tamaño:** 2×2.
- **Esfuerzo:** bajo. Conviene hacerlo junto con la idea 9, porque el teclado puede tapar la nota.

### 22. Cronómetro y temporizador
Un cronómetro con vueltas y un temporizador que avisa con un sonido.
- **API:** Web Audio para el sonido y la vibración web (`navigator.vibrate`), si el WebView lo permite.
- **Limitación:** el aviso solo suena mientras el launcher está visible. Al abrir otra app, el WebView se pausa y no hay notificaciones. Hay que avisarlo en la interfaz, y al volver (`afterResume`) mostrar si el tiempo ya terminó.
- **Tamaño:** 2×1.
- **Esfuerzo:** bajo.

### 23. Calculadora
Una calculadora básica en el escritorio, con teclas al estilo de la calculadora de Gingerbread (fondo negro y pulsación naranja).
- **Tamaño:** 4×3.
- **Esfuerzo:** bajo. Hay que evaluar las expresiones sin `eval`.

### 24. Lista de tareas
Una lista corta de tareas que se marcan al tocarlas; se añaden desde un campo al pie. Se guarda en localStorage.
- **Tamaño:** 2×2 o 4×2.
- **Esfuerzo:** bajo. Tiene los mismos problemas con el teclado que la nota (idea 9).

### 25. Marco de fotos ✅ Hecho
El clásico widget de Gingerbread: una foto con un marco blanco y ligeramente girada. Al tocarlo se elige la foto con `<input type="file">`; el Bridge original no abre el selector de archivos, nuestro fork sí (mejora 1.2). La foto se reduce a 800 px con un canvas y se guarda en IndexedDB, porque localStorage se queda corto. Cada marco tiene su propia foto. Más adelante podría ir rotando entre varias fotos.
- **Tamaño:** 2×2.
- **Esfuerzo:** medio. Está en `src/widgets/photo/`.

### 26. Apps más usadas ✅ Hecho
Una fila con las 4 apps que más se abren, cada una en su columna para que queden alineadas con los iconos del escritorio. Está en `src/widgets/mostUsed/`.
- Todos los lanzamientos pasan por `useAppLauncherStore`, que guarda las **recientes** (`launcher.recentApps`) y cuántas veces se abrió cada app (`launcher.launchCounts`).
- El orden sale de `mostUsedApps()` en `src/utils/mostUsed.ts`: primero las más abiertas; a igual cantidad, la usada más recientemente. Al principio, cuando todavía no hay cuentas, se completa con las recientes para que el widget no quede vacío.
- Las apps desinstaladas desaparecen del contador.
- **API:** `requestLaunchApp` y el evento `appRemoved`, para quitar las apps desinstaladas.
- **Tamaño:** 4×1.
- **Esfuerzo:** bajo.

### 27. Titulares RSS
Los últimos titulares de un feed RSS configurable, en una lista que se desplaza.
- **Limitaciones:** con el Bridge original los titulares no se pueden abrir, porque no abre URLs; con nuestro fork se abren con `requestOpenUrl`. Además, muchos feeds no permiten CORS; habría que elegir feeds que lo permitan o pasar por un proxy público.
- **Tamaño:** 4×2.
- **Esfuerzo:** medio.

### 28. Frase del día ✅ Hecho
Una cita que cambia cada día, elegida de una lista incluida en el proyecto (sin red), con su autor.
- **Tamaño:** 4×1.
- **Esfuerzo:** muy bajo.

### 30. Agenda ✅ Hecho
Los próximos eventos del calendario, como el widget de calendario de Android 2.x: a la izquierda el día de la semana y la fecha de hoy, y a la derecha los eventos de los próximos 14 días agrupados por día, cada uno con el color de su calendario, la hora y el título. Está en `src/widgets/agenda/`.
- **Solo con nuestro fork de Bridge:** `getCanReadCalendar`, `requestCalendarPermission`, `getCalendarEventsURL(from, to)`, `requestOpenCalendarEvent`, `requestOpenCalendarAt` y los eventos `canReadCalendarChanged` / `calendarChanged`. `useCalendarStore` lleva el permiso y vuelve a pedir los eventos cuando cambian; la agrupación por día está en `src/utils/calendar-events.ts`.
- Sin permiso, el widget dice "Toca para permitir el acceso al calendario" y al tocarlo aparece el diálogo de Android. Tocar un evento lo abre en la app de calendario, y tocar la fecha abre el calendario en hoy.
- **Tamaño:** 4×2 (caben unas 5 filas).
- **Esfuerzo:** medio, contando lo que hubo que añadir al fork.

### 31. Accesos directos de apps ✅ Hecho
Al mantener pulsada una app, en el escritorio o en el cajón, aparece un menú junto al icono con sus accesos directos ("Nuevo mensaje", "Ir a casa", "Nueva pestaña de incógnito"…) y, al final, "Información de la app". Gingerbread no los tenía (llegaron en Android 7.1), así que el menú imita sus menús contextuales: franja gris con el nombre de la app y filas claras que se ponen naranjas al pulsar.
- **Solo con nuestro fork de Bridge:** `getCanAccessAppShortcuts`, `getAppShortcutsURL`, `getAppShortcutIconURL` y `requestStartAppShortcut`. Android solo le da los accesos al launcher predeterminado.
- La misma pulsación larga inicia el arrastre: si el dedo se mueve, el menú se cierra y se arrastra la app (el cajón se cierra recién entonces); si se suelta sin moverlo, el arrastre se cancela y el menú queda abierto (`useDragStore.hasMoved`).
- Está en `src/shortcuts/` y `useAppShortcutsStore`.
- **Pendiente:** el menú en las apps de las carpetas, y cerrarlo con Atrás.

### 32. Panel de notificaciones y ajustes rápidos ✅ Hecho
Un panel propio al estilo de la cortina de Gingerbread 2.3, que baja al tocar la barra de estado Gingerbread (o el botón de notificaciones del Control de energía) en vez de abrir la de Android.
- Arriba, **ajustes rápidos** con el estilo del Control de energía: linterna, brillo (automático / bajo / medio / alto), rotación y sincronización cambian de verdad; Wi-Fi, Bluetooth y GPS muestran su estado y abren el panel de Android.
- Debajo, el reproductor de música (idea 33) y las notificaciones en "En curso" y "Notificaciones", con su icono, título, texto y hora. Al tocar una se abre; "Borrar" descarta las que se pueden descartar. Las notificaciones de los reproductores se ocultan mientras se muestra el reproductor (`isMedia`).
- **Solo con nuestro fork de Bridge:** acceso a notificaciones (`getNotificationsURL`, `requestOpenNotification`, `requestDismissNotification` y sus eventos) y ajustes rápidos (`requestSetFlashlightOn`, `requestSetScreenBrightnessAuto` / `Level`, `requestSetAutoRotateOn`, `requestSetMasterSyncOn`, `requestOpenSystemPanel`). Brillo y rotación necesitan el permiso "Modificar ajustes del sistema".
- Está en `src/notifications/`.

### 33. Música ✅ Hecho
Lo que suena en cualquier app (Spotify, YouTube Music…), con carátula, título, artista y los botones anterior / reproducir-pausa / siguiente.
- **Widget "Música"** (4×1) y el reproductor de arriba del panel de notificaciones: `widgets/music/MusicPlayer.vue`, con una barra de progreso que avanza sola.
- **Widget "Música (estilo Songbird)"** (4×1), más de Gingerbread: la carátula en un marco claro y, al lado, "Artista - Título" sobre tres botones grandes grises (`widgets/music/SongbirdPlayer.vue`).
- **Solo con nuestro fork de Bridge** y el acceso a notificaciones: `getMediaSession`, `getMediaArtURL`, `requestMediaAction`, `requestOpenMediaApp` y el evento `mediaSessionChanged`.

---

## Fallos de Bridge

Fallos del propio Bridge (también del original, no solo de nuestro fork) que el launcher esquiva. Conviene arreglarlos en el fork y reportarlos a Bridge.

- **Arriba e izquierda intercambiados en todos los insets.** `WindowInsetsSnapshot` declara `(top, left, right, bottom)`, pero `getSnapshot()` en `WindowInsetsSnapshot.kt` le pasa por posición `(left, top, right, bottom)`. En un Z Flip5 en vertical, el recorte de la cámara (33 px, arriba) llega como `left: 33, top: 0`, y lo mismo `statusBarsIgnoringVisibility`. (Que `statusBars` dé 0 con la barra oculta es normal: aparece al hacerla visible.) **Arreglo en el fork:** pasar los argumentos por nombre (`top = getTop(...)`, `left = getLeft(...)`). Afecta a los getters y a los eventos. Cuando el fork esté arreglado, el launcher podrá fiarse de `top` (y habrá que distinguir un Bridge arreglado de uno sin arreglar, por ejemplo con un método nuevo del fork).
- **Los eventos de insets no siguen los tipos de la API:** se llaman `ImeWindowInsetsChanged` (con mayúscula) y traen el valor en `insets`, no `imeWindowInsetsChanged` con `newValue`. El launcher ya acepta las dos formas (`parseInsetsEvent()`); en el fork habría que enviar el nombre en minúscula inicial y `newValue`.

## Lo que la API no permite (sin ampliar Bridge)

- Widgets nativos de Android.
- Abrir intents que no sean "abrir una app" o una URL.
- Detectar el botón Atrás. Hay un truco que sí funciona: `history.pushState` al abrir el cajón o la búsqueda, porque Bridge pasa el "atrás" al historial del WebView.
- Packs de iconos: están en la API como borrador, pero todavía no los ofrece Bridge.

Todo esto requeriría ampliar Bridge en Kotlin. Nuestro [fork](https://github.com/njpd57/bridge-launcher) ya resolvió, entre otras cosas, saber las apps predeterminadas, abrir URLs, bloquear la orientación en vertical, leer notificaciones, música, calendario y la señal real, los ajustes rápidos y los accesos directos de apps (ver la tabla del principio); el plan para el resto está en la página de Confluence "Mejoras propuestas a Bridge (fork)".
