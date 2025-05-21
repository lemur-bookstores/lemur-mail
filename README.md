# Documentación de LemurMail

¡Bienvenido a LemurMail! Esta librería ha sido diseñada para simplificar el envío de correos electrónicos en tus aplicaciones Node.js, ofreciendo una interfaz unificada para múltiples proveedores de servicios de email y una gestión de plantillas flexible.

## ¿Qué es LemurMail?

LemurMail es una capa de abstracción que te permite integrar fácilmente diferentes servicios de envío de correo (como Gmail, Mailgun, SMTP genérico, etc.) en tu aplicación. Su objetivo es desacoplar tu lógica de negocio de las APIs específicas de cada proveedor, facilitando el cambio entre ellos y la gestión de plantillas HTML con datos dinámicos.

### Instalación

Para empezar a usar LemurMail en tu proyecto, instala la librería :

```bash
npm install lemur-mail
```

Estructura de Carpetas Recomendada
Para una mejor organización y claridad en tu proyecto, sugerimos la siguiente estructura de carpetas:

```t
tu-proyecto/
├── lemur-mail.config.js  # Archivo de configuración para auto-detección (opcional)
├── templates/            # ¡Aquí van tus plantillas .mustache!
│   ├── bienvenida.mustache
│   └── verificacion.mustache
├── src/
│   └── app.ts            # Tu archivo principal de aplicación
├── node_modules/
├── package.json
├── tsconfig.json
└── ...
```

Uso Básico de LemurMail
La clase principal de la librería es LemurMail. Debes instanciarla con la configuración de tu proveedor de correo y, opcionalmente, la ruta base de tus plantillas.

## 1. Configuración de la Ruta Base de Plantillas

LemurMail te ofrece dos formas flexibles de definir dónde se encuentran tus archivos de plantilla (.mustache):

### a) Configuración Manual

Esta es la forma más explícita y recomendada para entornos de producción, donde la ruta de tus plantillas es conocida y estable.

Opción 1: Ruta Única (string)
Puedes especificar una única ruta (absoluta o relativa a la raíz de tu proyecto) donde se encuentran tus plantillas.

```typescript
// src/app.ts
import { LemurMail } from "lemur-mail";
import path from "path";

// Define la ruta a tu carpeta de plantillas
// path.resolve(__dirname, '..', 'templates') resuelve a:
// <ruta_absoluta_a_tu_proyecto>/templates
const templatesPath = path.resolve(__dirname, "..", "templates");

async function main() {
  const lemurMail = new LemurMail({
    path: templatesPath, // <-- Ruta manual definida aquí
    provider: {
      name: "nodemailer", // O 'gmail', 'mailgun'
      config: {
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: "tu_usuario_smtp",
          pass: "tu_password_smtp",
        },
      },
    },
  });

  // No es necesario llamar a await lemurMail.init() si la ruta se proporciona en el constructor
  await lemurMail.template("bienvenida").send(
    {
      to: "usuario@ejemplo.com",
      from: "Mi App <noreply@mi-app.com>",
      subject: "¡Bienvenido!",
    },
    { userName: "Carlos" }
  );
  console.log("Correo enviado con ruta manual (string).");
}
main();
```

Opción 2: Rutas por Entorno (object)
Ideal para diferenciar entre rutas de plantillas en desarrollo y producción, basándose en process.env.NODE_ENV.

```typescript
// src/app.ts
import { LemurMail } from "lemur-mail";
import path from "path";

async function main() {
  const lemurMail = new LemurMail({
    path: {
      // <-- Rutas por entorno definidas aquí
      develop: path.resolve(__dirname, "..", "src", "templates"), // En desarrollo
      production: path.resolve(__dirname, "..", "dist", "templates"), // En producción (si tus plantillas se copian a 'dist')
    },
    provider: {
      name: "gmail",
      config: {
        auth: {
          user: "tu_gmail@gmail.com",
          pass: "tu_password_app", // Contraseña de aplicación de Google
        },
      },
    },
  });

  // No es necesario llamar a await lemurMail.init() si la ruta se proporciona en el constructor
  await lemurMail.template("verificacion").send(
    {
      to: "otro.usuario@ejemplo.com",
      from: "Soporte <soporte@mi-app.com>",
      subject: "Verifica tu cuenta",
    },
    { verificationLink: "https://mi-app.com/verify/abc" }
  );
  console.log("Correo enviado con ruta manual (objeto por entorno).");
}
main();
```

### b) Configuración Automática

LemurMail puede intentar detectar la ruta de tus plantillas buscando un archivo de configuración llamado lemur-mail.config.js en la jerarquía de directorios de tu proyecto.

`Paso 1: Crea el archivo lemur-mail.config.js`
Coloca este archivo en la raíz de tu proyecto (junto a package.json) o en una carpeta que find-up pueda encontrar.

```typescript
// lemur-mail.config.js (en la raíz de tu proyecto)
const path = require("path");

module.exports = {
  // La ruta a tu carpeta de plantillas, relativa a la ubicación de este archivo de configuración
  path: path.resolve(__dirname, "templates"), // Ahora relativo a la raíz del proyecto
};
```

`Paso 2: Llama a .init() en tu aplicación`
Cuando instancies LemurMail sin proporcionar la propiedad path, deberás llamar al método asíncrono init() para que la librería intente auto-detectar la ruta.

```typescript
// src/app.ts
import { LemurMail } from "lemur-mail";

async function main() {
  const lemurMail = new LemurMail({
    // No se proporciona 'path' aquí, se usará la auto-detección
    provider: {
      name: "mailgun",
      config: {
        auth: {
          api_key: "tu_api_key_mailgun",
          domain: "tu_dominio_mailgun.com",
        },
      },
    },
  });

  console.log("Iniciando LemurMail con auto-detección...");
  await lemurMail.init(); // <-- ¡IMPORTANTE! Llama a init() para auto-detectar la ruta

  await lemurMail.template("recordatorio").send(
    {
      to: "usuario@ejemplo.com",
      from: "Alertas <alertas@mi-app.com>",
      subject: "Recordatorio Importante",
    },
    { mensaje: "No olvides tu cita mañana." }
  );
  console.log("Correo enviado con auto-detección.");
}
main();
```

`2. Creación de Plantillas (.mustache)`
Dentro de la carpeta de plantillas que hayas configurado (ej., src/templates/), crea tus archivos .mustache.

Ejemplo de `src/templates/bienvenida.mustache:`

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Bienvenido a nuestra App</title>
  </head>
  <body>
    <h1>¡Hola, {{userName}}!</h1>
    <p>Gracias por registrarte en nuestra aplicación.</p>
    <p>Para comenzar, haz clic en el siguiente enlace:</p>
    <p><a href="{{appUrl}}">Ir a la aplicación</a></p>
    <p>Saludos cordiales,</p>
    <p>El equipo de Mi App</p>
  </body>
</html>
```

`3. Envío del Correo`
Una vez que LemurMail está configurado y, si es necesario, inicializado (await .init()), puedes usar la API fluida para enviar correos:

```typescript
// Ejemplo de uso completo
import { LemurMail } from "lemur-mail";
import path from "path";

async function sendExampleEmail() {
  try {
    // 1. Instanciar LemurMail con tu proveedor y ruta de plantillas
    const lemurMail = new LemurMail({
      path: path.resolve(__dirname, "..", "templates"), // Ruta manual
      provider: {
        name: "nodemailer", // Usando SMTP genérico
        config: {
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: "tu_usuario_ethereal", // Credenciales de prueba de Ethereal.email
            pass: "tu_password_ethereal",
          },
        },
      },
    });

    // 2. Seleccionar la plantilla y enviar el correo
    await lemurMail.template("bienvenida").send(
      {
        to: "destinatario@ejemplo.com",
        from: "Mi App <noreply@mi-app.com>",
        subject: "¡Bienvenido a Mi App!",
        // No necesitas 'html' o 'text' aquí, la plantilla los generará
      },
      {
        // Datos para la plantilla 'bienvenida.mustache'
        userName: "Juan Pérez",
        appUrl: "https://mi-app.com/dashboard",
      }
    );

    console.log("Correo de bienvenida enviado con éxito.");
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

sendExampleEmail();
```

## Nuevas funciones

Agrega un emoji de estrella para la siguiente característica que quieres que implementemos o puedes proponer tu `PR`

- SendGrid:
- Amazon SES (Simple Email Service):
- Postmark: Mailchimp (para correos transaccionales, vía Mandrill)
- Resend:
