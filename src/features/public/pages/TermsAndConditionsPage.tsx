import { Link } from 'react-router-dom';
import { LegalDocument, type LegalSection } from '../components/LegalDocument';

const sections: LegalSection[] = [
  { id: 'service', title: 'Qué ofrece Comerzia', content: <p>Comerzia permite gestionar operaciones comerciales, productos, inventario, caja, sucursales y colaboradores desde una plataforma SaaS. Las funciones y capacidades disponibles dependen de la configuración y del plan de cada empresa. Este borrador describe el servicio; no inventa un contrato comercial ya aprobado.</p> },
  { id: 'accounts', title: 'Cuentas y administración de equipos', content: <>
    <p>Las cuentas pueden utilizar credenciales locales o Google cuando está habilitado. El acceso está sujeto a los permisos asignados y a los controles de seguridad correspondientes. Google identifica a la persona; no le concede automáticamente permisos de administración.</p>
    <p>El administrador de una empresa gestiona las invitaciones, los roles y las sucursales de sus colaboradores. Cada usuario debe cuidar sus credenciales y utilizar únicamente los accesos autorizados. Las condiciones formales de representación y responsabilidad del administrador deben aprobarse en la versión contractual.</p>
  </> },
  { id: 'business-data', title: 'Información y operaciones de la empresa', content: <>
    <p>Las empresas incorporan datos de sus operaciones y de las personas con las que trabajan. Deben determinar qué información corresponde registrar y quién puede consultarla o modificarla. Los permisos de acceso no sustituyen la autorización necesaria para tratar datos de terceros.</p>
    <p>Los reportes reflejan los registros y la configuración del sistema; deben contrastarse con la operación real cuando corresponda. La titularidad, licencias de uso y condiciones de exportación o entrega de información al terminar el servicio deben definirse expresamente.</p>
  </> },
  { id: 'subscriptions', title: 'Planes y condiciones comerciales', content: <>
    <p>La plataforma aplica capacidades de suscripción y puede impedir nuevas incorporaciones cuando se alcanza un límite. Las condiciones vinculantes sobre precio, moneda, impuestos, facturación, renovación, cancelación y reembolsos están pendientes de aprobación.</p>
    <p>Esta página no establece cobros, renovaciones automáticas, penalidades ni políticas de devolución que no hayan sido confirmados por el operador.</p>
  </> },
  { id: 'security', title: 'Uso autorizado y protección del acceso', content: <>
    <p>El diseño del servicio limita accesos a otras empresas, aplica controles contra solicitudes abusivas y exige confirmaciones adicionales para determinadas acciones sensibles. Los intentos de acceso indebido o los envíos repetidos pueden ser rechazados por esos controles.</p>
    <p>No deben compartirse contraseñas ni códigos del autenticador. Desvincular un método de acceso requiere las comprobaciones de seguridad y conservar otro método disponible. Las condiciones de suspensión contractual, notificación y reclamación deben aprobarse antes de publicar la versión definitiva.</p>
  </> },
  { id: 'privacy', title: 'Privacidad y servicios externos', content: <>
    <p>El tratamiento de información y el acceso mediante Google se describen en la <Link to="/privacy-policy">Política de privacidad</Link>. Los servicios externos mantienen sus propias condiciones. Su utilización no implica que Google u otro proveedor avale Comerzia.</p>
    <p>Los compromisos sobre disponibilidad, soporte, respaldos, mantenimiento, incidentes y responsabilidad requieren definición contractual; no se promete disponibilidad continua ni se limita aquí la responsabilidad por una cláusula inventada.</p>
  </> },
  { id: 'pending-confirmation', title: 'Decisiones pendientes antes de publicar', content: <ul>
    <li>Identidad y contacto del proveedor, destinatarios del servicio y capacidad para contratar.</li>
    <li>Precios, impuestos, pagos, renovación, cancelación y reembolsos.</li>
    <li>Uso permitido, propiedad intelectual, datos del cliente, exportación y cierre de cuentas.</li>
    <li>Disponibilidad y soporte comprometidos, respaldos y responsabilidades de cada parte.</li>
    <li>Suspensión, terminación, garantías y límites de responsabilidad legalmente procedentes.</li>
    <li>Ley y jurisdicción aplicables, solución de controversias, fecha de vigencia y comunicación de cambios.</li>
  </ul> },
];

export function TermsAndConditionsPage() {
  return <LegalDocument title="Términos y condiciones" introduction="Información sobre el servicio, las cuentas y las condiciones que deben aprobarse para su contratación." sections={sections} />;
}
