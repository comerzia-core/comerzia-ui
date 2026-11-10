import { PrivateLegalDocument } from '../components/PrivateLegalDocument';
import { LegalDocument, type LegalSection } from '../components/LegalDocument';

const sections: LegalSection[] = [
  {
    id: 'alcance',
    title: '1. Alcance y marco general de aplicación',
    content: (
      <>
        <p>
          La presente Política de Privacidad describe de manera pormenorizada y transparente las prácticas de Comerzia respecto a la recolección, recepción, tratamiento, almacenamiento, resguardo criptográfico, uso, transferencia y eliminación de datos personales e información empresarial generada a través de nuestra plataforma de software como servicio (SaaS), accesible mediante el dominio oficial <strong>https://comerzia-bo.netlify.app</strong> y sus servicios asociados.
        </p>
        <p>
          Comerzia presta servicios tecnológicos dirigidos a empresas, comercios y profesionales establecidos principalmente en el Estado Plurinacional de Bolivia. En el desarrollo ordinario de sus actividades operativas, las empresas clientes registran, procesan y custodian en Comerzia información vinculada con sus propios colaboradores, sucursales, clientes, compradores y proveedores comerciales.
        </p>
        <p>
          Respecto a los datos e información comercial que cada empresa cliente incorpora y administra de manera autónoma en el sistema, la empresa cliente actúa como la titular y responsable primaria de la gestión y licitud de dichos datos, actuando Comerzia como encargado técnico del procesamiento y custodia de la infraestructura computacional, sujeto a estrictas medidas de seguridad y confidencialidad.
        </p>
      </>
    )
  },
  {
    id: 'informacion-recopilada',
    title: '2. Categorías de información y datos recopilados',
    content: (
      <>
        <p>
          En función de los módulos activados, las configuraciones empresariales y los métodos de acceso seleccionados por el usuario, Comerzia puede tratar las siguientes categorías de datos:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Datos de identificación y contacto de cuentas:</strong> Nombres y apellidos completos, direcciones de correo electrónico, identificador de usuario único (username), números de teléfono comercial de contacto y perfiles corporativos creados.
          </li>
          <li>
            <strong>Credenciales y datos de seguridad:</strong> Contraseñas de acceso protegidas irreversiblemente mediante funciones hash criptográficas seguras (BCrypt/Argon2), factores de autenticación de dos pasos (códigos TOTP protegidos mediante cifrado AES-256-GCM), claves maestras y tokens temporales de sesión.
          </li>
          <li>
            <strong>Información comercial y operativa:</strong> Catálogos de productos, listas de precios, existencias e inventarios de mercadería, registros de ventas, boletas y notas de entrega, órdenes de compra a proveedores, movimientos y aperturas de caja chica, configuración de sucursales físicas y asignación de colaboradores.
          </li>
          <li>
            <strong>Archivos y contenidos multimedia:</strong> Fotografías de productos, logotipos comerciales de empresa, comprobantes digitales y documentos adjuntos cargados voluntariamente por la empresa cliente.
          </li>
          <li>
            <strong>Metadatos técnicos y de seguridad:</strong> Direcciones IP de origen utilizadas en peticiones, información de agentes de usuario del navegador (User-Agent), identificadores únicos de sesión cifrada, marcas temporales de acceso (timestamps), registros de auditoría de seguridad y eventos de autenticación necesarios para la prevención de intrusiones y fraudes.
          </li>
          <li>
            <strong>Datos administrativos de suscripción:</strong> Historial de planes contratados, constancias manuales de transferencias bancarias o pagos QR Simple, vigencias de suscripción y comprobantes fiscales de servicio.
          </li>
        </ul>
        <p className="mt-2">
          Comerzia únicamente recopila y procesa aquella información estrictamente indispensable para el cumplimiento efectivo y seguro de las funciones de la plataforma.
        </p>
      </>
    )
  },
  {
    id: 'google-oauth',
    title: '3. Integración con Google OAuth 2.0 y cumplimiento de políticas de datos',
    content: (
      <>
        <p>
          Comerzia ofrece de manera opcional a los usuarios la posibilidad de autenticarse e iniciar sesión mediante sus cuentas de Google a través del protocolo estándar de la industria Google OpenID Connect (OAuth 2.0).
        </p>
        <p>
          <strong>Alcance de permisos solicitados (Scopes):</strong> Al utilizar esta funcionalidad, Comerzia solicita exclusivamente los alcances mínimos esenciales para validar la identidad digital del usuario:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>openid</code>: Para autenticar de forma criptográfica la identidad digital del usuario.</li>
          <li><code>email</code>: Para obtener la dirección de correo electrónico principal asociada a la cuenta Google y verificar si se encuentra verificada.</li>
          <li><code>profile</code>: Para acceder a información básica de perfil público facilitada voluntariamente por el usuario (nombre, apellido y fotografía de perfil).</li>
        </ul>
        <p className="mt-2">
          <strong>Finalidad exclusiva del uso de datos de Google:</strong> Los datos personales obtenidos mediante la autenticación de Google se utilizan de manera exclusiva y restrictiva para:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identificar unívocamente al usuario en el sistema y verificar su pertenencia a la empresa correspondiente.</li>
          <li>Permitir el inicio de sesión ágil y seguro sin necesidad de recordar contraseñas locales adicionales.</li>
          <li>Vincular de forma voluntaria la identidad de Google con el perfil de usuario preexistente en Comerzia desde la sección de seguridad de la cuenta.</li>
          <li>Procesar y validar la aceptación de invitaciones de personal remitidas por una empresa cliente, contrastando que el correo invitado coincida con la cuenta autenticada.</li>
        </ul>
        <div className="bg-base-200/70 p-4 rounded-xl border border-base-300 my-4 space-y-2">
          <p className="font-semibold text-base-content">
            Cumplimiento expreso de la Política de Datos de Usuario de los Servicios de API de Google:
          </p>
          <p className="text-xs sm:text-sm leading-relaxed">
            El uso y la transferencia que Comerzia haga a cualquier otra aplicación de la información recibida a través de las APIs de Google se apegará rigurosamente a la <strong>Política de Datos de Usuario de los Servicios de las APIs de Google</strong>, incluidos los requisitos de <strong>Uso Limitado (Limited Use Requirements)</strong>.
          </p>
          <p className="text-xs sm:text-sm leading-relaxed">
            Comerzia <strong>NO transfiere, NO vende, NO arrienda ni comercializa bajo ninguna circunstancia los datos obtenidos de Google a terceros anunciantes, corredores de datos (data brokers) ni redes de publicidad en línea</strong>. Asimismo, estos datos no se emplean para publicidad basada en intereses, segmentación comercial ni análisis automatizado de riesgo crediticio.
          </p>
        </div>
        <p>
          <strong>No acceso a información privada adicional:</strong> Comerzia no solicita ni accede a contraseñas de cuentas Google, bandejas de entrada de Gmail, archivos de Google Drive, citas de Google Calendar ni libretas de contactos personales.
        </p>
        <p>
          <strong>Revocación y desvinculación:</strong> El usuario puede revocar en cualquier instante el acceso de Comerzia a su cuenta Google directamente desde la configuración de seguridad de su cuenta Google en <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://myaccount.google.com/permissions</a>, o desvincular la cuenta desde el panel de perfil en Comerzia. La desvinculación no elimina automáticamente los registros empresariales internos que la empresa cliente esté legalmente obligada a conservar.
        </p>
      </>
    )
  },
  {
    id: 'finalidades',
    title: '4. Finalidades del tratamiento de la información',
    content: (
      <>
        <p>Comerzia utiliza la información tratada con las siguientes finalidades legítimas y específicas:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Crear, operar, mantener y personalizar cuentas de usuario y empresas clientes en la plataforma.</li>
          <li>Suministrar las funciones contratadas de inventario, ventas, compras, caja y administración comercial.</li>
          <li>Garantizar el control granular de autorizaciones, permisos de colaboradores y separación estricta de datos entre empresas (aislamiento multitenant).</li>
          <li>Ejecutar procesos de autenticación, validación de sesiones activas y flujos de recuperación segura de contraseñas.</li>
          <li>Remitir notificaciones transaccionales y de seguridad estrictamente operativas (alertas de nuevo inicio de sesión, cambios de credenciales, códigos de verificación e invitaciones de colaboradores).</li>
          <li>Atender y canalizar solicitudes de soporte técnico, aclaraciones operativas y requerimientos del cliente.</li>
          <li>Monitorear la salud operativa del sistema, prevenir intrusiones informáticas, mitigar ataques de denegación de servicio y evitar abusos deliberados.</li>
          <li>Dar cumplimiento estricto a deberes legales, requerimientos de autoridades públicas competentes o normativas tributarias aplicables en Bolivia.</li>
        </ul>
        <p className="mt-2">
          Comerzia no vende ni alquila datos de sus usuarios a terceras entidades para fines de mercadotecnia ni publicidad comercial no solicitada.
        </p>
      </>
    )
  },
  {
    id: 'consentimiento',
    title: '5. Consentimiento, bases de licitud y transparencia',
    content: (
      <>
        <p>
          El tratamiento de datos personales por parte de Comerzia se fundamenta en:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Ejecución contractual:</strong> El tratamiento indispensable para prestar las funcionalidades contratadas de software según los Términos y Condiciones aceptados.</li>
          <li><strong>Consentimiento expreso:</strong> Manifestado de forma libre e inequívoca al registrarse en el servicio, vincular cuentas federadas de Google o activar funciones complementarias.</li>
          <li><strong>Cumplimiento de obligaciones legales:</strong> Conservación obligatoria de registros contables, tributarios o de auditoría informática conforme a las leyes bolivianas.</li>
          <li><strong>Interés legítimo en seguridad:</strong> Mantenimiento de la integridad, resguardo de la infraestructura y protección frente a fraudes y ciberataques.</li>
        </ul>
        <p className="mt-2">
          Cada empresa cliente es la encargada directa de contar con el consentimiento o base de licitud legal necesaria para recopilar e incorporar al sistema los datos de sus propios colaboradores, compradores finales y proveedores.
        </p>
      </>
    )
  },
  {
    id: 'acceso-info',
    title: '6. Acceso, aislamiento y confidencialidad entre empresas',
    content: (
      <>
        <p>
          <strong>Aislamiento estricto multitenant:</strong> Comerzia implementa políticas y filtros a nivel de arquitectura y base de datos para garantizar la separación total e infranqueable de la información entre distintas organizaciones. Ningún usuario o colaborador de una empresa puede consultar, visualizar, modificar ni inferir información perteneciente a otra empresa cliente de la plataforma.
        </p>
        <p>
          <strong>Acceso del personal técnico de Comerzia:</strong> El acceso a los entornos operativos y bases de datos por parte del personal de ingeniería o soporte técnico de Comerzia se encuentra estrictamente restringido bajo principios de privilegio mínimo (least privilege), autenticación multifactorial obligatoria y registro de auditoría, autorizándose únicamente para tareas legítimas y documentadas de soporte técnico solicitado, resolución de incidencias graves o mantenimiento programado.
        </p>
      </>
    )
  },
  {
    id: 'proveedores-tecnologicos',
    title: '7. Proveedores de servicios y transferencias técnicas internacionales',
    content: (
      <>
        <p>
          Para suministrar una plataforma SaaS robusta, redundante y de alta disponibilidad, Comerzia contrata los servicios de proveedores tecnológicos líderes en la industria de la computación en la nube:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Google Cloud Platform (EE. UU. / Global):</strong> Proveedor de los servicios de identidad, autorización OIDC y autenticación digital.
          </li>
          <li>
            <strong>Amazon Web Services - AWS SES (Región us-east-2, EE. UU.):</strong> Proveedor de infraestructura para la entrega transaccional de correos electrónicos del sistema (verificaciones, restablecimiento de contraseñas e invitaciones a colaboradores).
          </li>
          <li>
            <strong>Netlify Inc. (EE. UU. / Global):</strong> Proveedor de alojamiento web, optimización estática y red perimetral de entrega de contenidos (CDN) del frontend de la aplicación.
          </li>
          <li>
            <strong>Cloudinary Ltd. (EE. UU. / Global):</strong> Infraestructura de nube dedicada a la custodia, procesamiento y optimización de imágenes de productos y logotipos comerciales.
          </li>
          <li>
            <strong>Proveedores de Servidores Privados Virtuales (VPS):</strong> Infraestructura de cómputo en centros de datos especializados con almacenamiento seguro de bases de datos relacionales MySQL 8.4 y memoria Redis para gestión de sesiones.
          </li>
        </ul>
        <p className="mt-2">
          Debido a la naturaleza global de los centros de datos de dichos proveedores, ciertos datos técnicos y de almacenamiento pueden ser transferidos y procesados en servidores ubicados fuera de Bolivia, garantizándose que todos los proveedores seleccionados cumplen con los más rigurosos estándares de seguridad y certificaciones internacionales (ISO/IEC 27001, SOC 2, SOC 3 y cifrado TLS en tránsito y AES en reposo).
        </p>
      </>
    )
  },
  {
    id: 'cookies',
    title: '8. Cookies técnicas y almacenamiento local del navegador',
    content: (
      <>
        <p>
          Comerzia utiliza cookies y tecnologías de almacenamiento local en el navegador (como <code>localStorage</code> y <code>sessionStorage</code>) de carácter estrictamente técnico y funcional:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cookies de sesión y autenticación:</strong> Cookies seguras con atributos <code>HttpOnly</code>, <code>SameSite</code> y cifrado de cabeceras destinadas a preservar la sesión autenticada del usuario y proteger las transacciones contra ataques de falsificación de peticiones en sitios cruzados (CSRF).</li>
          <li><strong>Almacenamiento de preferencias:</strong> Almacenamiento de opciones de interfaz de usuario, tales como el tema visual de pantalla (modo claro u oscuro) o la última empresa y sucursal seleccionada.</li>
          <li><strong>Cookies de flujo de identidad federada:</strong> Cookies de estado temporal de corta duración (TTL inferior a 5 minutos) requeridas exclusivamente para la verificación criptográfica del retorno de autorización OAuth 2.0 de Google.</li>
        </ul>
        <p className="mt-2">
          Comerzia <strong>no utiliza cookies de seguimiento publicitario de terceros, píxeles de remarketing ni herramientas invasivas de analítica comercial de terceros</strong> en los paneles privados de gestión.
        </p>
      </>
    )
  },
  {
    id: 'seguridad-datos',
    title: '9. Medidas de seguridad técnica, organizativa y criptográfica',
    content: (
      <>
        <p>
          La seguridad de la información es un pilar fundamental en la arquitectura de Comerzia. La plataforma implementa medidas técnicas y operativas exhaustivas conforme a estándares de la industria:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cifrado en tránsito:</strong> Todo el tráfico entre los navegadores de los usuarios y nuestros servidores se cifra de forma obligatoria mediante el protocolo HTTPS utilizando algoritmos TLS 1.2 o TLS 1.3 con certificados digitales válidos y políticas estrictas de cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).</li>
          <li><strong>Cifrado en reposo:</strong> Las contraseñas se almacenan mediante algoritmos de derivación de claves con sal (salt) y alto factor de trabajo. El material sensible de autenticación en dos factores (TOTP secrets) se almacena cifrado en bases de datos mediante claves AES-256-GCM independientes gestionadas de forma rotativa.</li>
          <li><strong>Protección de sesiones y accesos:</strong> Firmas digitales HMAC en tokens de sesión, validación de huella de usuario, desconexión forzada ante detección de suspensiones y limitadores de intentos fallidos (rate limiting) en endpoints de autenticación para mitigar ataques de fuerza bruta.</li>
          <li><strong>Aislamiento de procesos:</strong> Ejecución de servicios en contenedores Docker aislados, con usuarios de sistema no privilegiados y redes internas separadas entre servicios de aplicación y bases de datos.</li>
        </ul>
        <p className="mt-2">
          A pesar de adoptar las máximas precauciones razonables, el usuario comprende que ninguna transmisión por Internet ni almacenamiento electrónico es 100% invulnerable frente a incidentes imprevistos de ciberseguridad, asumiendo Comerzia el compromiso de actuar diligentemente ante cualquier eventualidad informando oportunamente a los afectados.
        </p>
      </>
    )
  },
  {
    id: 'conservacion',
    title: '10. Períodos de conservación, custodia y eliminación de datos',
    content: (
      <>
        <p>
          Los datos comerciales y personales asociados a una empresa se conservan de forma activa durante todo el tiempo que la empresa mantenga una suscripción vigente y activa en Comerzia.
        </p>
        <p>
          <strong>Procedimiento post-rescisión (Ventana de 30 días):</strong> Tras la cancelación o terminación efectiva del servicio por falta de pago o decisión voluntaria del cliente:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>La información comercial se conservará en estado de custodia y acceso restringido durante un período de treinta (30) días calendario.</li>
          <li>Durante este período, la empresa podrá requerir a través de nuestro correo de soporte (<strong>comerzia.erp@gmail.com</strong>) la exportación íntegra de sus catálogos, existencias, clientes y transacciones históricas en formato estructurado estándar.</li>
          <li>Transcurridos los 30 días calendario, los datos ingresarán a un ciclo de eliminación y borrado digital definitivo en los servidores primarios y en la rotación regular de copias de seguridad de la infraestructura.</li>
        </ul>
        <p className="mt-2">
          Ciertos registros mínimos de facturación administrativa, constancias de transacciones bancarias y registros históricos de eventos de seguridad (logs de accesos e IPs asociadas a incidentes) podrán conservarse durante los plazos legalmente obligatorios fijados por el Código de Comercio de Bolivia y las leyes tributarias aplicables.
        </p>
      </>
    )
  },
  {
    id: 'derechos',
    title: '11. Derechos de los titulares y procedimiento para su ejercicio',
    content: (
      <>
        <p>
          De conformidad con los principios generales de autodeterminación informativa y protección de datos, los titulares de la información personal tratada en Comerzia tienen derecho a:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Acceso:</strong> Conocer qué datos personales propios se encuentran almacenados y procesados en la plataforma.</li>
          <li><strong>Rectificación y actualización:</strong> Solicitar la corrección o actualización de datos personales inexactos, erróneos o desactualizados.</li>
          <li><strong>Cancelación o supresión:</strong> Solicitar la eliminación de sus datos personales cuando no sean necesarios para la relación contractual o no medie obligación legal de conservarlos.</li>
          <li><strong>Revocación del consentimiento:</strong> Retirar en cualquier momento las autorizaciones otorgadas para el tratamiento de sus datos personales o acceso mediante Google OAuth.</li>
        </ul>
        <p className="mt-2">
          Para ejercer cualquiera de estos derechos, el titular podrá remitir una solicitud formal por escrito a nuestra casilla oficial: <strong>comerzia.erp@gmail.com</strong>, acreditando fehacientemente su identidad e indicando el alcance de su solicitud. Comerzia evaluará y dará respuesta formal a la solicitud en un plazo máximo de quince (15) días hábiles.
        </p>
      </>
    )
  },
  {
    id: 'cambios-politica',
    title: '12. Actualización y vigencia de la Política de Privacidad',
    content: (
      <>
        <p>
          Comerzia se reserva el derecho de modificar, actualizar o complementar periódicamente esta Política de Privacidad para mantener su conformidad con nuevas normativas aplicables, estándares de seguridad en la nube o actualizaciones funcionales del software.
        </p>
        <p>
          Cualquier cambio sustancial será debidamente notificado a través de la plataforma o mediante correo electrónico enviado a las empresas usuarias antes de su fecha efectiva de aplicación. La fecha de la última actualización se indicará de manera visible en el encabezado del presente documento.
        </p>
        <p>
          Se alienta a los usuarios a revisar periódicamente este documento para mantenerse informados acerca de las medidas de protección y custodia que implementamos.
        </p>
      </>
    )
  },
  {
    id: 'contacto-privacidad',
    title: '13. Canales oficiales de contacto del Responsable de Privacidad',
    content: (
      <div className="space-y-2 text-sm">
        <p>
          Para cualquier consulta, queja, ejercicio de derechos o requerimiento relativo a la privacidad y tratamiento de datos personales en Comerzia, ponemos a disposición nuestros canales directos de contacto:
        </p>
        <div className="bg-base-200/60 p-4 rounded-xl border border-base-300 space-y-1">
          <p><strong>Responsable del Tratamiento:</strong> Comerzia</p>
          <p><strong>País de establecimiento y operación:</strong> Bolivia</p>
          <p><strong>Domicilio de contacto y legal:</strong> La Paz, Bolivia</p>
          <p><strong>Correo oficial de privacidad y soporte:</strong> <a href="mailto:comerzia.erp@gmail.com" className="text-primary hover:underline font-medium">comerzia.erp@gmail.com</a></p>
          <p><strong>Sitio web oficial de la plataforma:</strong> <a href="https://comerzia-bo.netlify.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">https://comerzia-bo.netlify.app</a></p>
        </div>
      </div>
    )
  }
];

export function PrivacyPolicyPage({ privateDesign = false }: { privateDesign?: boolean } = {}) {
  const Document = privateDesign ? PrivateLegalDocument : LegalDocument;
  return (
    <Document
      title="Política de Privacidad de Comerzia"
      introduction="Versión 1.0 — En vigor desde el 7 de noviembre de 2026. Documento informativo oficial sobre el tratamiento, seguridad y protección de datos personales en la plataforma Comerzia (Bolivia)."
      sections={sections}
      isDraft={false}
    />
  );
}
