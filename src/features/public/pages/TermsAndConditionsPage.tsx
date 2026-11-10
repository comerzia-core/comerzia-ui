import { PrivateLegalDocument } from '../components/PrivateLegalDocument';
import { Link } from 'react-router-dom';
import { LegalDocument, type LegalSection } from '../components/LegalDocument';

const sections: LegalSection[] = [
  {
    id: 'objeto',
    title: '1. Objeto del servicio',
    content: (
      <>
        <p>
          Comerzia es una plataforma integral de software como servicio (SaaS, por sus siglas en inglés) diseñada para proporcionar soluciones digitales de gestión empresarial, administración operativa y control de negocios a empresas, comerciantes y emprendedores. La plataforma comprende herramientas tecnológicas avanzadas para la administración de catálogos de productos, inventarios multialmacén, registro y control de ventas, compras a proveedores, arqueos y control de caja chica, administración multisucursal, asignación granular de roles para colaboradores y publicación opcional de catálogos comerciales digitales en línea, conforme a las capacidades, límites y módulos habilitados en cada plan contratado.
        </p>
        <p>
          Comerzia actúa única y exclusivamente como proveedor de infraestructura tecnológica y herramientas digitales de software. En virtud de su naturaleza como proveedor técnico, Comerzia no actúa como comerciante, revendedor, distribuidor ni comisionista de los productos o servicios ofrecidos o comercializados por las empresas usuarias a través de la plataforma. Comerzia no intermedia en las negociaciones comerciales, no fija precios finales al consumidor ni interviene en la entrega material de los bienes vendidos.
        </p>
        <p>
          Asimismo, Comerzia no procesa, no custodia, no recauda ni retiene fondos dinerarios derivados de las transacciones comerciales efectuadas entre las empresas usuarias y sus respectivos clientes o compradores finales. Todas las transacciones comerciales, acuerdos de entrega, garantías posventa y transferencias de dinero se celebran de manera directa, privada e independiente entre la empresa usuaria y sus compradores.
        </p>
      </>
    )
  },
  {
    id: 'registro',
    title: '2. Registro, cuentas y representación empresarial',
    content: (
      <>
        <p>
          Para acceder a los servicios y registrar una organización en Comerzia, la persona solicitante debe proporcionar información veraz, completa, exacta y debidamente actualizada. La creación de una cuenta empresarial exige declarar y garantizar que la persona física que efectúa el registro cuenta con la capacidad legal plena, personería y facultades estatutarias o contractuales suficientes para obligar válidamente a la entidad comercial o empresa en cuyo nombre actúa.
        </p>
        <p>
          La activación y uso de los servicios de la plataforma requiere la aceptación expresa, libre e informada de los presentes Términos y Condiciones, así como la consulta y conformidad con la <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link> de Comerzia.
        </p>
        <p>
          Cada empresa cliente es la exclusiva responsable de la gestión, custodia, asignación y revocación de permisos, roles y accesos otorgados a sus dependientes, trabajadores y colaboradores. El ingreso a la plataforma mediante autenticación federada con Google (Google OAuth 2.0 / OpenID Connect) o a través de credenciales locales de acceso constituye un mecanismo de validación de identidad técnica que en ningún caso otorga facultades administrativas automáticas sin la debida asignación previa por parte del administrador o propietario de la empresa cliente.
        </p>
      </>
    )
  },
  {
    id: 'suscripciones',
    title: '3. Suscripciones, tarifas y condiciones de pago',
    content: (
      <>
        <p>
          Comerzia pone a disposición de sus clientes diversos planes de suscripción bajo modalidad de prepago periódico (mensual o anual según la oferta vigente), cuyas características, cuotas de almacenamiento, límites de sucursales, número de colaboradores y tarifas aplicables se detallan de forma previa y transparente en los canales oficiales antes de la formalización del servicio.
        </p>
        <p>
          <strong>Moneda de facturación:</strong> Todas las tarifas y pagos se determinan y liquidan principalmente en moneda nacional de curso legal, Bolivianos (BOB), o en el equivalente acordado contractualmente para clientes corporativos o internacionales.
        </p>
        <p>
          <strong>Medios de pago y facturación:</strong> Los pagos por concepto de suscripción se efectúan de manera manual y directa mediante transferencias bancarias electrónicas a cuentas oficiales autorizadas o cobros a través del sistema de pagos QR Simple interbancario de Bolivia. Comerzia no realiza cargos automáticos ni débitos recurrentes no autorizados en cuentas bancarias o tarjetas de crédito del cliente.
        </p>
        <p>
          <strong>Vencimiento y continuidad del servicio:</strong> Al expirar el período contratado y cancelado, la continuidad operativa del acceso dependerá de la acreditación oportuna del pago correspondiente al siguiente ciclo. Comerzia otorgará un período de gracia razonable debidamente notificado, transcurrido el cual la plataforma podrá suspender temporalmente el acceso a los módulos operativos de la empresa hasta la regularización de la suscripción, sin que ello implique la pérdida inmediata de la información comercial registrada.
        </p>
        <p>
          <strong>Política sobre períodos no utilizados y reembolsos:</strong> Los pagos efectuados corresponden a la habilitación y disponibilidad de la infraestructura tecnológica contratada por el período seleccionado. No se realizan devoluciones ni reembolsos prorrateados por cancelaciones anticipadas voluntarias o períodos mensuales no utilizados una vez activado el ciclo de servicio correspondiente.
        </p>
      </>
    )
  },
  {
    id: 'titularidad',
    title: '4. Información, titularidad de datos y propiedad intelectual',
    content: (
      <>
        <p>
          La empresa cliente conserva la exclusiva y total propiedad, así como todos los derechos intelectuales, comerciales y patrimoniales que legítimamente le correspondan, sobre sus registros comerciales, inventarios, transacciones, listas de clientes, catálogos, marcas comerciales, logotipos, archivos y contenidos gráficos incorporados al sistema.
        </p>
        <p>
          Al ingresar información y contenidos en la plataforma, la empresa cliente confiere a Comerzia una licencia de uso de carácter estrictamente técnico, no exclusiva, limitada, revocable y libre de regalías, con el único propósito de almacenar, alojar, respaldar, procesar informáticamente, reproducir técnicamente y mostrar dichos datos para la correcta ejecución y provisión de los servicios contratados.
        </p>
        <p>
          Esta licencia no transfiere de ninguna forma la titularidad o propiedad de los datos a favor de Comerzia ni faculta a la plataforma para comercializar, monetizar, explotar o ceder la información empresarial a terceros no vinculados con la operación técnica esencial del software.
        </p>
        <p>
          El software Comerzia, su código fuente, arquitectura de microservicios, bases de datos subyacentes, algoritmos, interfaces de usuario, diseños visuales, elementos gráficos distintivos y marcas registradas son de titularidad y propiedad exclusiva de Comerzia y de sus legítimos desarrolladores, encontrándose protegidos por las leyes de propiedad intelectual y tratados internacionales aplicables.
        </p>
      </>
    )
  },
  {
    id: 'catalogos-prohibiciones',
    title: '5. Catálogos comerciales y actividades estrictamente prohibidas',
    content: (
      <>
        <p>
          Las empresas que opten por habilitar y publicar catálogos en línea o escaparates comerciales digitales son las únicas y directas responsables de garantizar que todos los bienes, servicios, descripciones, especificaciones técnicas, precios e imágenes exhibidas cumplan plenamente con las leyes del Estado Plurinacional de Bolivia, las normas de protección al consumidor y los derechos de propiedad industrial y de terceros.
        </p>
        <p>
          Queda terminantemente prohibido utilizar Comerzia, sus servicios conexos o sus catálogos públicos para:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Alojar, exhibir o difundir material con contenido de abuso o explotación sexual infantil de cualquier índole.</li>
          <li>Comercializar productos controlados, sustancias ilícitas, armas de fuego, medicamentos no autorizados, mercadería falsificada o artículos cuya venta esté prohibida o penada por la legislación boliviana e internacional.</li>
          <li>Cometer actos de fraude electrónico, engaño al consumidor, suplantación de identidad comercial o estafas financieras.</li>
          <li>Vulnerar derechos de autor, patentes, marcas registradas o secretos comerciales de terceros sin la debida autorización de su titular.</li>
          <li>Desarrollar actividades ilícitas de lavado de activos, financiamiento del terrorismo o conductas contrarias al orden público y las buenas costumbres.</li>
        </ul>
        <p className="mt-2">
          Comerzia se reserva el derecho de adoptar medidas técnicas y operativas inmediatas y proporcionadas ante indicios de contenido presuntamente ilícito o transgresor de estas condiciones, incluyendo la revisión técnica, la deshabilitación del escaparate público, el bloqueo de contenidos o la suspensión definitiva de la cuenta infractora, sin perjuicio de remitir los antecedentes ante las autoridades públicas competentes.
        </p>
      </>
    )
  },
  {
    id: 'seguridad',
    title: '6. Seguridad de cuentas, contraseñas y uso de la infraestructura',
    content: (
      <>
        <p>
          Los usuarios son legalmente responsables de mantener la confidencialidad, privacidad y custodia estricta de sus credenciales de acceso, contraseñas maestras y dispositivos generadores de códigos de autenticación de dos factores (2FA / TOTP). Cualquier operación efectuada en la plataforma mediante credenciales válidas se presumirá efectuada por el usuario titular o por quien cuente con su autorización expresa.
        </p>
        <p>
          Se prohíben de forma absoluta y expresa las acciones orientadas a vulnerar, interceptar, sobrecargar o alterar la seguridad e integridad del sistema, incluyendo de forma enunciativa pero no limitativa:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Intentos de acceso no autorizado, ataques de fuerza bruta, elusión de mecanismos de autenticación multifactor o escalamiento ilegítimo de privilegios.</li>
          <li>Extracción automatizada masiva de datos (web scraping, minería indebida de datos o crawling abusivo) sin consentimiento escrito previo.</li>
          <li>Inyección deliberada de código malicioso, scripts nocivos, troyanos, virus informáticos o ejecución de vectores de denegación de servicio (DoS/DDoS).</li>
          <li>Ingeniería inversa, descompilación o intento de descifrado del código fuente o de la estructura interna del backend.</li>
        </ul>
        <p className="mt-2">
          Comerzia implementa mecanismos activos de seguridad criptográfica, límites de tasa de peticiones (rate limiting), listas de control de acceso y monitoreo automatizado para neutralizar conductas abusivas y preservar la estabilidad de la infraestructura compartida.
        </p>
      </>
    )
  },
  {
    id: 'cancelacion',
    title: '7. Cancelación, rescisión y procedimiento de exportación de datos',
    content: (
      <>
        <p>
          El cliente puede solicitar la baja o cancelación de su suscripción en cualquier momento a través de los canales formales de atención y soporte al cliente provistos en la plataforma.
        </p>
        <p>
          <strong>Ventana de custodia y exportación de datos de 30 días:</strong> Tras la finalización o rescisión efectiva del servicio, Comerzia conservará la información comercial del cliente bajo medidas de resguardo y acceso restringido durante una ventana de gracia improrrogable de treinta (30) días calendario. Durante este lapso, el representante acreditado de la empresa podrá solicitar a través de soporte técnico la entrega de una exportación de sus datos estructurados disponibles (inventarios, catálogos, registros históricos de ventas y clientes).
        </p>
        <p>
          La exportación se entregará en formatos digitales estructurados, legibles y técnicamente estándares (tales como JSON, CSV o equivalentes), previa verificación rigurosa de la identidad y de la personería del solicitante. Este procedimiento no incluye bajo ninguna circunstancia la entrega de código fuente del sistema, licencias de software propietario ni copias de la arquitectura interna de bases de datos de Comerzia.
        </p>
        <p>
          <strong>Eliminación definitiva programada:</strong> Vencido el plazo de 30 días calendario sin que medie solicitud de exportación o renovación de servicios, los datos de la empresa ingresarán de manera automática a un proceso de eliminación programada y borrado digital seguro en los servidores principales y en los ciclos de rotación de copias de respaldo, salvo aquellos registros mínimos que Comerzia deba preservar en virtud de obligaciones legales, fiscales o auditorías de seguridad obligatorias.
        </p>
      </>
    )
  },
  {
    id: 'disponibilidad',
    title: '8. Disponibilidad operativa, mantenimiento y límite de responsabilidad',
    content: (
      <>
        <p>
          Comerzia despliega sus mejores esfuerzos técnicos, operativos y profesionales para garantizar altos estándares de continuidad, estabilidad y disponibilidad en la prestación de los servicios SaaS en la nube.
        </p>
        <p>
          No obstante la aplicación de buenas prácticas de la industria, el cliente reconoce que el funcionamiento de la plataforma depende de factores técnicos e infraestructuras externas de conectividad, redes públicas de telecomunicaciones, servidores cloud internacionales y suministro eléctrico que no están bajo el control exclusivo de Comerzia. Comerzia no garantiza un funcionamiento ininterrumpido, carente de suspensiones programadas por labores de actualización técnica y mantenimiento de infraestructura, ni responde por contingencias derivadas de fuerza mayor o caso fortuito.
        </p>
        <p>
          En la máxima medida autorizada por la legislación boliviana aplicable, Comerzia no asume responsabilidad por daños indirectos, incidentales, punitivos, lucro cesante o pérdidas comerciales derivadas del mal uso del sistema, errores en la carga de datos por el usuario, interrupciones generales en servicios de terceros de telecomunicaciones o suspensión justificada por falta de pago de la suscripción.
        </p>
      </>
    )
  },
  {
    id: 'privacidad-proveedores',
    title: '9. Privacidad, confidencialidad y proveedores tecnológicos esenciales',
    content: (
      <>
        <p>
          La confidencialidad y el tratamiento de los datos personales recopilados se regulan en detalle en la <Link to="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link> de Comerzia, la cual forma parte integrante e indivisible de los presentes Términos.
        </p>
        <p>
          Para suministrar sus capacidades tecnológicas con alta disponibilidad, Comerzia subcontrata proveedores de infraestructura en la nube de estándar internacional, incluyendo:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Google Cloud Identity / OAuth 2.0:</strong> Para autenticación federada segura e inicio de sesión simplificado.</li>
          <li><strong>Amazon Web Services (AWS SES):</strong> Para la entrega transaccional confiable de correos electrónicos del sistema e invitaciones.</li>
          <li><strong>Netlify:</strong> Para el alojamiento, distribución perimetral y entrega segura por CDN del frontend web.</li>
          <li><strong>Cloudinary:</strong> Para la optimización, resguardo y procesamiento seguro de activos visuales y fotografías de productos.</li>
          <li>Infraestructuras dedicadas de servidores privados virtuales (VPS) para la ejecución del backend y almacenamiento de datos MySQL/Redis.</li>
        </ul>
        <p className="mt-2">
          Dichos proveedores actúan en calidad de encargados técnicos de infraestructura, sujetos a estrictas políticas de confidencialidad y acuerdos de protección de datos.
        </p>
      </>
    )
  },
  {
    id: 'suspension',
    title: '10. Suspensión justificada y terminación extraordinaria del servicio',
    content: (
      <>
        <p>
          Comerzia se reserva la facultad de limitar funciones, suspender temporalmente el acceso a módulos o cancelar definitivamente una cuenta de usuario o empresa cliente, mediando causa justificada, en los siguientes supuestos:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Incumplimiento grave o reiterado de cualquiera de las cláusulas de los presentes Términos y Condiciones.</li>
          <li>Falta oportuna de acreditación de pago de la tarifa de suscripción una vez vencido el período de gracia otorgado.</li>
          <li>Detección de actividades ilícitas, fraudulentas, comercialización de artículos no permitidos o transgresión de normas penales bolivianas.</li>
          <li>Riesgos inminentes de ciberseguridad, ataques dirigidos a la infraestructura compartida o vulneración de derechos de terceros.</li>
          <li>Requerimiento formal, instrucción cautelar u orden escrita emanada de autoridad administrativa, fiscal o judicial competente de Bolivia.</li>
        </ul>
        <p className="mt-2">
          Salvo que medie prohibición judicial expresa o un riesgo de seguridad crítico, Comerzia procurará notificar al titular de la cuenta los motivos de la medida cautelar adoptada a fin de permitir las aclaraciones correspondientes.
        </p>
      </>
    )
  },
  {
    id: 'modificaciones',
    title: '11. Actualización y modificación de las condiciones del servicio',
    content: (
      <>
        <p>
          Comerzia podrá modificar o actualizar los presentes Términos y Condiciones para adecuarlos a nuevas funcionalidades técnicas del sistema, innovaciones operativas, directrices de plataformas integradas o cambios en el marco normativo legal aplicable.
        </p>
        <p>
          Toda modificación sustancial será informada previamente a los usuarios a través de la plataforma, avisos en el panel de control o mediante correo electrónico remitido a la dirección registrada. Las modificaciones entrarán en vigor a partir de la fecha de publicación oficial en el sitio web y no tendrán carácter retroactivo en perjuicio de derechos adquiridos durante ciclos prepagados vigentes.
        </p>
        <p>
          El uso continuado de los servicios de Comerzia con posterioridad a la entrada en vigor de las modificaciones constituye plena manifestación de conformidad y aceptación de las nuevas condiciones publicadas.
        </p>
      </>
    )
  },
  {
    id: 'legislacion',
    title: '12. Marco legal, resolución de controversias y jurisdicción aplicable',
    content: (
      <>
        <p>
          Los presentes Términos y Condiciones, así como toda relación jurídica o comercial derivada del uso de la plataforma Comerzia, se rigen e interpretan en su totalidad bajo las leyes y normativas vigentes en el Estado Plurinacional de Bolivia.
        </p>
        <p>
          Ante cualquier duda, queja, inconformidad o reclamación vinculada con el servicio, el usuario y Comerzia se comprometen a buscar en primera instancia una solución amistosa y directa a través del canal oficial de atención al cliente habilitado en <strong>comerzia.erp@gmail.com</strong>.
        </p>
        <p>
          En caso de no alcanzarse un acuerdo amistoso en un plazo razonable de treinta (30) días, las partes acuerdan someter la resolución de cualquier discrepancia jurídica a los juzgados y tribunales ordinarios competentes de la ciudad de <strong>La Paz, Bolivia</strong>, renunciando de manera expresa a cualquier otro fuero o jurisdicción que pudiera corresponder por razón de sus domicilios presentes o futuros.
        </p>
      </>
    )
  },
  {
    id: 'contacto',
    title: '13. Canales oficiales de contacto e información del operador',
    content: (
      <div className="space-y-2 text-sm">
        <p>
          Para cualquier consulta legal, requerimiento formal, aclaración contractual o soporte técnico relativo a los presentes Términos, ponemos a disposición nuestros canales directos:
        </p>
        <div className="bg-base-200/60 p-4 rounded-xl border border-base-300 space-y-1">
          <p><strong>Identificación del Operador:</strong> Comerzia, persona natural establecida en Bolivia.</p>
          <p><strong>Domicilio de contacto y legal:</strong> La Paz, Bolivia.</p>
          <p><strong>Correo electrónico de soporte y atención legal:</strong> <a href="mailto:comerzia.erp@gmail.com" className="text-primary hover:underline font-medium">comerzia.erp@gmail.com</a></p>
          <p><strong>Portal web oficial del servicio:</strong> <a href="https://comerzia-bo.netlify.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">https://comerzia-bo.netlify.app</a></p>
        </div>
      </div>
    )
  }
];

export function TermsAndConditionsPage({ privateDesign = false }: { privateDesign?: boolean } = {}) {
  const Document = privateDesign ? PrivateLegalDocument : LegalDocument;
  return (
    <Document
      title="Términos y Condiciones de Comerzia"
      introduction="Versión 1.0 — En vigor desde el 7 de noviembre de 2026. Documento normativo oficial que rige el acceso y uso de la plataforma Comerzia en el Estado Plurinacional de Bolivia."
      sections={sections}
      isDraft={false}
    />
  );
}
