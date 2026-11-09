import { PrivateLegalDocument } from '../components/PrivateLegalDocument';

export function PrivatePrivacyPolicyPage() {
  return <PrivateLegalDocument title="Política de privacidad · Instalación privada" sections={[
    { id: 'scope', title: 'Uso de esta instalación', content: <p>Esta instalación de Comerzia permite a una organización gestionar su actividad y el acceso de su personal. El administrador de la organización asigna las cuentas y permisos de trabajo.</p> },
    { id: 'data', title: 'Información tratada', content: <p>El sistema puede tratar nombres, correos, datos de cuenta y del personal, información de clientes y registros operativos de productos, inventario, ventas y caja. La información disponible depende de los módulos y permisos habilitados.</p> },
    { id: 'access', title: 'Identificación y seguridad', content: <p>Las credenciales, sesiones y verificaciones de seguridad permiten controlar el acceso. Si se habilita la vinculación con Google, se utiliza la identificación de la cuenta, el correo y los datos básicos de perfil necesarios para el inicio de sesión. Los registros de seguridad permiten revisar accesos y cambios.</p> },
    { id: 'providers', title: 'Servicios de apoyo', content: <p>El funcionamiento puede utilizar servicios configurados para alojamiento, correo, imágenes y autenticación. La organización responsable debe identificar los proveedores utilizados y explicar las condiciones de tratamiento aplicables a su instalación.</p> },
    { id: 'requests', title: 'Consultas y gestión de datos', content: <p>Solicita al administrador de tu organización la identificación del responsable y el canal para consultar o solicitar la corrección de tus datos. Los plazos de conservación, las solicitudes de eliminación y las obligaciones de conservar registros deben ser definidos por esa organización.</p> },
  ]} />;
}
