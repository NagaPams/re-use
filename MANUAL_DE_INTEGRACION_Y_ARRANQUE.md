# Guía de Integración, Modificaciones y Arranque Local: RE-USE

Esta guía documenta los cambios arquitectónicos y visuales implementados desde la conexión de la API con el Frontend de **RE-USE**, y proporciona instrucciones sencillas para que cualquier miembro del equipo pueda descargar, configurar y ejecutar el proyecto en su computadora local.

---

## 🛠️ Resumen de Modificaciones del Proyecto

Desde la integración del Frontend con el Backend en base de datos PostgreSQL, se resolvieron y mejoraron los siguientes aspectos técnicos y de experiencia de usuario (UX):

### 1. 💬 Mensajería en Tiempo Real y Scroll Dinámico
* **Sincronización de Angular (Zone.js)**: Al actualizar mensajes mediante Socket.io o Axios desde el backend, Angular no refrescaba el DOM debido a la ejecución asíncrona fuera de su zona. Se envolvieron los flujos en `NgZone.run(...)` en `mock-data.service.ts` para forzar actualizaciones reactivas en tiempo real.
* **Auto-Scroll al Final**: En `messages.component.ts`, se implementó un `effect` reactivo para desplazar la conversación automáticamente hacia abajo en cuanto se envía o recibe un mensaje.

### 🖼️ 2. Fotos de Perfil en la Bandeja de Chats
* **Consultas Relacionales**: Se modificó la consulta en `chatController.js` para realizar un doble `JOIN` a la tabla `Usuario` (comprador y vendedor), extrayendo el campo `AvatarUrl` del interlocutor como `partnerAvatarUrl`.
* **Sidebar Actualizado**: La bandeja muestra el avatar del estudiante correspondiente en lugar del ícono genérico, con retroceso seguro a avatar por defecto.

### ⚠️ 3. Control de Errores y Validación de Archivos en Chat
* **Validación en Cliente y Servidor**: Se añadió una validación estricta en el chat para limitar el peso de archivos adjuntos a **10 MB**.
* **Alertas Inteligentes**: Si un usuario intenta enviar un archivo no soportado o que excede el límite (por ejemplo, un PDF de 90 MB), la aplicación muestra una alerta nativa detallando el error y limpia el input para permitir reintentar.

### 📷 4. Actualización de Publicaciones y Carga de Imágenes
* **Corrección de Queries SQL**: Se reescribió `updatePublication` en `publicationController.js` para consultar los valores previos de la base de datos en lugar de usar sentencias de coalescencia ciegas, evitando que precios en `$0` (donación o trueque) se restablecieran a valores anteriores.
* **Middleware Flexibilizado**: Se aumentó el límite de carga de imágenes en `uploadMiddleware.js` a **10 MB** y se admiten todos los formatos de imagen móviles.

### 🔍 5. Buscador y Enlaces en "Mis Publicaciones"
* **Buscador Propio**: La sección de perfil del usuario ahora cuenta con una barra de búsqueda dedicada para filtrar sus propias publicaciones.
* **Desplazamiento Dinámico**: Al dar clic en "Mis Publicaciones" en el navbar, el sistema redirige a `/profile?section=publications` y hace scroll automático al inicio de dicha sección una vez que se cargan los datos.

### 🔝 6. Botones Flotantes y Comportamiento de Scroll
* **Botón Flotante Atrás (FAB)**: Se integró un botón flotante responsivo con desenfoque de fondo glassmorphic (`backdrop-filter`) en el detalle de componente, edición y mensajería para que no se pierda al hacer scroll.
* **Restauración de Scroll**: Se habilitó la restauración de posición de scroll en `app.config.ts`, asegurando que al cambiar de vista, la nueva pantalla cargue siempre desde el inicio (arriba).

### ✉️ 7. Validación de Correo con Redirección Estética
* **Fin del JSON Crudo**: El endpoint `/api/auth/verify/:token` del backend ahora redirige usando un código HTTP 302 a una página angular `/email-verified`.
* **Interfaz de Éxito/Error**: Se diseñó el componente `EmailVerifiedComponent` con animaciones SVG y un diseño glassmorphic elegante para confirmar el estatus de activación de cuenta.

### 🔑 8. Restablecimiento de Contraseña y Alerta de Registro
* **Recuperación Segura**: Se crearon las vistas `/forgot-password` (solicitud de enlace) y `/reset-password` (nueva contraseña con validaciones de longitud y coincidencia).
* **Hasheo y JWT**: Los enlaces de recuperación se generan con tokens firmados con JWT (expiración de 15 minutos). El backend recibe el token, lo valida y hashea la nueva contraseña usando `bcrypt` (factor 10).
* **Alerta en Login**: Al registrarse con éxito, el usuario es redirigido a `/login` y se le muestra un banner verde azulado animado instruyéndole a verificar su correo electrónico antes de ingresar.

### 📧 9. Envío de Correos Reales
* **Nodemailer Integrado**: Se configuró Nodemailer en el backend para enviar correos reales (con plantillas HTML corporativas adaptadas a la estética RE-USE) utilizando Gmail.
* **Resiliencia en Desarrollo**: El servicio de correo asíncrono se ejecuta sin bloquear la API y continúa imprimiendo los enlaces en la terminal para desarrollo local si las credenciales de correo no se configuran.

### 🗑️ 10. Eliminación de Publicaciones con Confirmación Modal
* **Flujo Seguro**: Se agregó un botón rojo "Eliminar" junto al botón "Editar" en la lista de publicaciones del perfil del usuario.
* **Confirmación Modal**: Reutiliza dinámicamente el modal de confirmación, actualizando su contenido para advertir que la acción es permanente antes de ejecutar el borrado físico en PostgreSQL (`DELETE /api/publications/:id`).

---

## 🚀 Instrucciones de Arranque Local para el Equipo

Para ejecutar todo el ecosistema de **RE-USE** en tu máquina local, sigue detalladamente los pasos a continuación:

### 📋 Requisitos Previos
Debes tener instalado en tu computadora:
* **Node.js** (Versión 18 o superior recomendada).
* **PostgreSQL** (Servicio activo).

---

### 💾 Paso 1: Configuración de la Base de Datos (PostgreSQL)

1. Abre tu gestor de base de datos de PostgreSQL (como pgAdmin o la terminal psql).
2. Crea una base de datos vacía llamada `reuse_db`.
3. Abre e importa el archivo `tablas.sql` ubicado en la raíz del proyecto para crear las tablas necesarias e inicializar la base de datos.

---

### 💻 Paso 2: Configuración y Arranque del Backend

1. Abre tu terminal y navega a la carpeta del **backend**:
   ```bash
   cd backend
   ```
2. Instala las dependencias del servidor:
   ```bash
   npm install
   ```
3. Configura las variables de entorno:
   - Duplica o edita el archivo `.env` en la carpeta del backend.
   - Ajusta los datos de conexión a tu base de datos de PostgreSQL:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_USER=tu_usuario_postgres
     DB_PASSWORD=tu_contrasena_postgres
     DB_NAME=reuse_db
     DB_PORT=5432
     JWT_SECRET=supersecretjwtkeyforreuseapp2026

     # Si deseas probar el envío de correos reales con tu cuenta de Gmail:
     SMTP_USER=tu_correo@gmail.com
     SMTP_PASS=tu_contrasena_de_aplicacion_google
     SMTP_FROM="RE-USE <tu_correo@gmail.com>"
     ```
     *(Nota: Si dejas las variables de correo SMTP en blanco o con sus valores de ejemplo, los correos reales no se enviarán pero los enlaces seguirán imprimiéndose en la consola para desarrollo local).*

4. Inicia el servidor backend en modo desarrollo:
   ```bash
   npm run dev
   ```
   El servidor correrá en `http://localhost:3000`. Deberías ver el mensaje:
   `Servidor corriendo en http://localhost:3000`

---

### 🎨 Paso 3: Configuración y Arranque del Frontend

1. Abre otra ventana de la terminal y navega a la carpeta del **frontend**:
   ```bash
   cd frontend
   ```
2. Instala las dependencias del cliente de Angular:
   ```bash
   npm install
   ```
3. Arranca el servidor de desarrollo de Angular:
   ```bash
   npm start
   ```
4. Abre tu navegador e ingresa a:
   `http://localhost:4200`

---

### 🧪 Flujo de Pruebas Recomendado
1. **Registro**: Crea una cuenta en `/register`. Verás un banner informativo en el Login.
2. **Activación de Cuenta**: Ve a la consola del backend, copia el enlace de activación (`http://localhost:3000/api/auth/verify/...`), pégalo en el navegador y comprueba la redirección al diseño de cuenta verificada.
3. **Login**: Inicia sesión con tus credenciales activadas.
4. **Olvidé Contraseña**: Cierra sesión, ve a `/forgot-password`, introduce tu correo, y usa el enlace impreso en la terminal del backend o enviado a tu correo real para restablecerla de forma segura en `/reset-password`.
