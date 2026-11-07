import { LegalDocument, type LegalSection } from '../components/LegalDocument';

const sections: LegalSection[] = [
  { id: 'scope', title: 'El servicio y sus participantes', content: <>
    <p>Comerzia es un servicio de gestión empresarial en la nube para administrar productos, inventario, ventas, compras, caja, sucursales y equipos de trabajo. Las empresas incorporan información propia y pueden registrar datos de colaboradores, clientes y proveedores.</p>
    <p>Esta página describe el tratamiento relacionado con el servicio y sus cuentas. La identificación legal del operador y la distribución de responsabilidades con cada empresa cliente están pendientes de confirmación; no se atribuye aquí una condición legal sin validar.</p>
  </> },
  { id: 'data', title: 'Información que utiliza Comerzia', content: <>
    <ul><li>Datos de cuenta y contacto, como nombre, usuario y correo electrónico; relación con una empresa, roles y sucursales asignadas.</li><li>Información comercial y personal que cada empresa registra en sus operaciones, incluidos archivos o imágenes cuando utiliza esas funciones.</li><li>Datos técnicos de seguridad: sesiones, dirección IP en controles y registros aplicables, eventos de acceso, permisos e historial de operaciones de seguridad.</li><li>Credenciales protegidas: las contraseñas locales se almacenan mediante hash; los secretos del autenticador y material sensible de mensajes se protegen mediante cifrado según su función.</li></ul>
    <p>No todos estos datos se solicitan en cada pantalla. La información registrada depende de las funciones utilizadas y de las decisiones de la empresa administradora.</p>
  </> },
  { id: 'google', title: 'Autenticación con Google', content: <>
    <p>Cuando eliges Google, Comerzia solicita los permisos <code>openid</code>, <code>email</code> y <code>profile</code>. Recibe el identificador de tu cuenta Google, correo y su estado de verificación, nombre y, cuando está disponible, imagen de perfil. Se utilizan para identificarte y completar el registro, ingreso, vinculación o aceptación de una invitación.</p>
    <p>Para confirmar de nuevo tu identidad en una operación sensible, puede utilizar la antigüedad de autenticación que Google proporcione. Comerzia valida las credenciales del protocolo; no recibe tu contraseña de Google. Este acceso no solicita permisos para leer Gmail, Drive, Calendar ni tus contactos.</p>
    <p>Vincular Google no sustituye los permisos de tu empresa ni el segundo factor que corresponda. Una invitación exige que el correo de la cuenta utilizada coincida con el invitado.</p>
    <p>Puedes gestionar los métodos vinculados en tu perfil cuando las comprobaciones de seguridad lo permiten; no se permite retirar el único método de acceso. También puedes retirar el acceso desde tu cuenta Google. Retirarlo no equivale a borrar la cuenta Comerzia, los registros de tu empresa o el historial de seguridad.</p>
  </> },
  { id: 'purposes', title: 'Para qué se utiliza la información', content: <>
    <p>Para prestar las funciones de gestión contratadas, autenticar cuentas, aplicar permisos, tramitar invitaciones, recuperar accesos, enviar comunicaciones de seguridad y detectar o limitar abusos. La información de una empresa se administra dentro de su contexto y según los permisos asignados.</p>
    <p>Las bases legales aplicables y cualquier uso adicional deben confirmarse antes de aprobar esta política. Este borrador no autoriza publicidad, venta de datos ni usos ajenos al servicio.</p>
  </> },
  { id: 'providers', title: 'Acceso y proveedores tecnológicos', content: <>
    <p>Los usuarios autorizados por una empresa pueden acceder a información según su rol. La arquitectura utiliza alojamiento del backend y base de datos, Netlify para el sitio, Amazon SES para correos, Google como proveedor de identidad y Cloudinary para archivos o imágenes en las funciones configuradas.</p>
    <p>El inventario productivo, las entidades proveedoras, sus ubicaciones y las condiciones de transferencias internacionales deben validarse antes de publicar. No se afirma una residencia de datos o un acuerdo con proveedores que no esté confirmado.</p>
  </> },
  { id: 'storage', title: 'Cookies, conservación y seguridad', content: <>
    <p>Comerzia utiliza cookies y almacenamiento del navegador para sesiones, protección de solicitudes, continuidad de los flujos de acceso y preferencias como el tema visual. La configuración final de medición y herramientas externas deberá revisarse antes de definir si requiere avisos o consentimiento adicionales.</p>
    <p>El sistema conserva datos operativos, registros de seguridad y, cuando corresponde, historial de registros desactivados. Desactivar o desvincular no implica una eliminación inmediata. Los períodos de conservación, tratamiento de respaldos y procedimiento de eliminación aún deben aprobarse; no se promete aquí un plazo ficticio.</p>
    <p>Se aplican controles de acceso y protección de credenciales. Ningún sistema puede garantizar seguridad absoluta.</p>
  </> },
  { id: 'requests', title: 'Consultas y solicitudes sobre tus datos', content: <>
    <p>Para datos que tu empresa registra y administra, consulta a su responsable. Para consultas sobre la plataforma, hace falta designar y publicar el contacto del operador. El procedimiento debe contemplar la verificación de identidad y las obligaciones de conservación aplicables; no se promete una eliminación que afecte indebidamente registros empresariales.</p>
    <p>El canal de atención y los derechos, plazos y autoridades que correspondan se completarán conforme a la jurisdicción y al tratamiento finalmente aprobados.</p>
  </> },
  { id: 'pending-confirmation', title: 'Datos pendientes antes de publicar', content: <ul>
    <li>Razón social o identidad del operador, domicilio y país de establecimiento.</li>
    <li>Correo real de privacidad y soporte, procedimiento de solicitudes y responsable de atención.</li>
    <li>Países atendidos, bases legales y responsabilidades entre Comerzia y las empresas clientes.</li>
    <li>Retención por categoría, eliminación y exportación, respaldos y obligaciones de conservación.</li>
    <li>Proveedores productivos, ubicaciones, transferencias y uso efectivo de cookies o analítica.</li>
    <li>Fecha de vigencia, mecanismo para comunicar cambios y revisión legal del texto definitivo.</li>
  </ul> },
];

export function PrivacyPolicyPage() {
  return <LegalDocument title="Política de privacidad" introduction="Cómo se utiliza la información de las cuentas y de los negocios que trabajan con Comerzia." sections={sections} />;
}
