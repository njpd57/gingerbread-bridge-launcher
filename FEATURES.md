# Funciones posibles con la API de Bridge

**Estado:** las ideas 1 a 5, 7, 15, 16, 20, 25 y 28 ya están implementadas (marcadas con ✅). La 9 y la 26 están hechas en parte (marcadas con ◐). Las ideas 1 a 5 están probadas en un Samsung Galaxy Z Flip5 con Bridge 0.1.0alpha, y la 7 (con la búsqueda web) con nuestro fork de Bridge; los widgets 15, 16, 20, 25 y 28 todavía no se han probado en el teléfono. La 25 necesita nuestro fork.

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
| Solo en nuestro fork de Bridge | `requestSetScreenOrientation` (vertical fija), `getDefaultAppPackageName` (dock), `requestOpenUrl` (búsqueda web), notificaciones (`getNotificationsURL`, `getNotificationIconURL`, `requestOpenNotification`, `requestDismissNotification` y sus eventos: iconos reales en la barra de estado y panel de notificaciones propio), ajustes rápidos (linterna, brillo, rotación, sincronización y `requestOpenSystemPanel` para Wi-Fi, Bluetooth y GPS; también en el widget Control de energía), música (`getMediaSession`, `requestMediaAction`: widget "Música" y reproductor en el panel) | `getScreenOrientation`, evento `screenOrientationChanged`. **Faltan en el fork:** leer si Wi-Fi, Bluetooth y GPS están encendidos (ver la idea 5) |

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
- **Con nuestro fork de Bridge** el widget pasa a los 5 botones del original de Android 2.3: **Wi-Fi, Bluetooth, GPS, sincronización y brillo**. Bloquear y modo noche siguen ahí con una pulsación larga: sobre el brillo cambia el modo noche y sobre la sincronización bloquea la pantalla (esos dos botones ya no sirven para mover el widget; los otros tres sí). Sincronización y brillo cambian de verdad; Wi-Fi, Bluetooth y GPS solo abren el panel de Android (`requestOpenSystemPanel`) y **no muestran su estado**, salvo Wi-Fi, que se enciende en verde si la conexión es Wi-Fi.
- **Pendiente en el fork:** para que Wi-Fi, Bluetooth y GPS tengan su barra verde o gris hace falta que Bridge exponga su estado:
  - `getWifiEnabled()` con `WifiManager.isWifiEnabled()` (permiso `ACCESS_WIFI_STATE`, normal, no se le pide al usuario) y el evento `wifiEnabledChanged` (broadcast `WIFI_STATE_CHANGED_ACTION`).
  - `getBluetoothEnabled()` con `BluetoothAdapter.isEnabled()` y el evento `bluetoothEnabledChanged` (broadcast `ACTION_STATE_CHANGED`). Desde Android 12 necesita el permiso `BLUETOOTH_CONNECT`, que el usuario tiene que conceder.
  - `getLocationEnabled()` con `LocationManager.isLocationEnabled()` (sin permiso) y el evento `locationEnabledChanged` (broadcast `PROVIDERS_CHANGED_ACTION`).
  - Del lado del launcher: declararlos en `src/types/bridge-fork.d.ts` y en `ForkBridgeMock`, leerlos en `useQuickSettingsStore` y cambiar los `indicator none` de `PowerControlWidget.vue` y `QuickToggles.vue` por `onOffIndicator(...)` (y añadir el GPS al panel).
- **Esfuerzo:** medio. Aprovecha lo que ya existe para añadir widgets.

> Para el botón del modo noche hay que conceder el permiso una vez con `npm run grant-permissions` (ver "Permisos opcionales" en el README). Bridge 0.1.0alpha no tiene `getCanRequestSystemNightMode()`, así que el launcher intenta el cambio sin poder comprobar el permiso antes. Los permisos se vuelven a leer al volver al launcher, porque darlos por adb no genera ningún evento.

### 6. Toques al fondo animado del sistema
Si el usuario elige como fondo del sistema un fondo **animado** (live wallpaper), esos fondos reaccionan a los toques. Eso también era típico de Gingerbread, por ejemplo con el fondo "Nexus" real.
- **API:** `sendWallpaperTap(x, y)` al tocar un hueco vacío cuando el fondo es "Fondo del sistema". Hoy esos toques solo generan pulsos en nuestro fondo Nexus.
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
- **Esfuerzo:** medio. Está hecho en `src/widgets/search/`, con la búsqueda en `src/utils/search.ts`. Las apps recientes salen de `useAppLauncherStore`, por donde pasan todos los lanzamientos, y el panel usa `useKeyboardInset()` para que el teclado no tape los resultados.

---

## Mejoras de uso

### 8. Doble toque para bloquear la pantalla
No existía en Gingerbread, pero es muy práctico. Sería opcional en Apariencia.
- **API:** `requestLockScreen()` y `getCanLockScreen()`. Requiere activar el servicio de accesibilidad de Bridge y permitir el bloqueo en sus ajustes. En Android 9 y posteriores, después de bloquear así hay que desbloquear con el PIN, no con la huella; Bridge lo advierte en su documentación.
- **Esfuerzo:** bajo.

### 9. Que el teclado no tape los campos ◐ En parte
Al escribir la ciudad del tiempo o renombrar una carpeta, el teclado puede tapar el campo.
- **API:** `getImeWindowInsets()` y el evento `imeWindowInsetsChanged`, para subir el contenido lo que ocupa el teclado.
- **Hecho:** el composable `useKeyboardInset()`, que ya usa el panel de búsqueda. Combina la altura del teclado que da Bridge con lo que el WebView ya se encogió.
- **Falta:** aplicarlo al campo de la ciudad del tiempo y al nombre de las carpetas.
- **Esfuerzo:** bajo.

### 10. Cambio de página por el borde sin chocar con el gesto "Atrás"
Al arrastrar un icono al borde para pasar de página, esa zona coincide con el gesto de volver atrás de Android.
- **API:** `getSystemGesturesWindowInsets()` y `getMandatorySystemGesturesWindowInsets()`, para usar esa zona como referencia en `EDGE_PX` (`useDragStore`).
- **Esfuerzo:** bajo.

### 11. Esquivar la cámara con precisión
La barra de Gingerbread deja el centro libre "a ojo". Con la forma real del recorte se puede reservar justo ese espacio y colocar las notificaciones y los iconos a su alrededor.
- **API:** `getDisplayCutoutPath()` (Android 12+) y `getDisplayShapePath()` (Android 14+, esquinas redondeadas de la pantalla). Ambas devuelven un path SVG.
- **Esfuerzo:** medio.

---

## Herramientas y mantenimiento

### 12. Pantalla "Acerca de" y diagnóstico
Una opción en el menú (o una pulsación larga en "Bridge") que muestre:
- La versión de Bridge (`getBridgeVersionName` / `getBridgeVersionCode`) y de Android (`getAndroidAPILevel`).
- **Los insets que reporta Bridge en ese momento.** Nos habría ahorrado adivinar cuando la barra de estado medía 0.
- El último error de la API (`getLastErrorMessage`).
- Un botón para abrir la **consola de desarrollo** de Bridge (`requestOpenDeveloperConsole`).
- **Esfuerzo:** bajo.

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
La cuadrícula del mes actual con el día de hoy resaltado en naranja y flechas para cambiar de mes. No muestra eventos, porque la API no puede leer el calendario del teléfono.
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

### 26. Apps más usadas ◐ En parte
Una fila con las 4 apps que más se abren. El launcher cuenta los lanzamientos al llamar a `requestLaunchApp` (desde el cajón, el escritorio, las carpetas y la búsqueda) y los guarda en localStorage. Ese mismo contador serviría para las "apps recientes" de la búsqueda (idea 7).
- **Hecho:** todos los lanzamientos ya pasan por `useAppLauncherStore`, que guarda las **recientes** (`launcher.recentApps`). **Falta** contar cuántas veces se abre cada app y el widget.
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

---

## Lo que la API no permite (sin ampliar Bridge)

- Widgets nativos de Android.
- Leer la señal móvil y el Wi-Fi reales. (Leer notificaciones y controlar la música ya se puede con nuestro fork.)
- Abrir intents que no sean "abrir una app" o una URL.
- Detectar el botón Atrás. Hay un truco que sí funciona: `history.pushState` al abrir el cajón o la búsqueda, porque Bridge pasa el "atrás" al historial del WebView.
- Packs de iconos: están en la API como borrador, pero todavía no los ofrece Bridge.

Todo esto requeriría ampliar Bridge en Kotlin. Nuestro [fork](https://github.com/njpd57/bridge-launcher) ya resolvió saber las apps predeterminadas, abrir URLs y bloquear la orientación en vertical; el plan para el resto está en la página de Confluence "Mejoras propuestas a Bridge (fork)".
