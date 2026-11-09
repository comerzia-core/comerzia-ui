import { PrivateLegalDocument } from '../components/PrivateLegalDocument';

export function PrivateTermsAndConditionsPage() {
  return <PrivateLegalDocument title="Términos y condiciones · Instalación privada" sections={[
    { id: 'access', title: 'Acceso autorizado', content: <p>Esta instalación está destinada al personal autorizado por la organización que la administra. Las cuentas, funciones y permisos se asignan según las responsabilidades de cada persona.</p> },
    { id: 'accounts', title: 'Cuidado de tu cuenta', content: <p>Utiliza tu cuenta personal y protege tu contraseña y tus factores de autenticación. Comunica al administrador cualquier acceso que no reconozcas o la pérdida de un medio de verificación.</p> },
    { id: 'operations', title: 'Registro de operaciones', content: <p>Antes de confirmar ventas, movimientos, precios o configuraciones, revisa la información ingresada. Los accesos y las modificaciones pueden quedar registrados para el control operativo y de seguridad.</p> },
    { id: 'catalogs', title: 'Información compartida', content: <p>Si la organización habilita y publica un catálogo digital, la información comercial seleccionada podrá ser consultada por sus visitantes. La organización determina los productos, precios y datos comerciales que comparte.</p> },
    { id: 'conditions', title: 'Condiciones de la organización', content: <p>El responsable de esta instalación debe confirmar las condiciones de uso, el soporte, la disponibilidad, los datos de contacto y las políticas internas aplicables antes de aprobar este documento. Las condiciones comerciales de la organización deben comunicarse por sus canales oficiales.</p> },
  ]} />;
}
