# Cierre local de seguridad — 7 de noviembre de 2026

Se añade confirmación primaria mediante Google desde identidades del perfil y
se envía el contexto autenticado al completar REAUTH. El backend comprueba
sesión, subject, antigüedad firmada y cuenta; no se confía en una bandera del
navegador. Fallos al consultar métodos muestran error/reintento. Los botones
usan el contrato `label` del UI kit, incluyendo confirmar, desvincular y
establecer contraseña; no se elimina el último método de acceso.

La confirmación reciente necesita Google Session age claims (aplicación
publicada/verificada y configuración de Google). Sin ese claim el rechazo
es deliberado. El login Google básico permanece separado de esta exigencia.

ESLint pasa a 10.14.0 y react-refresh a 0.5.7; se conserva el perfil de reglas
`@eslint/js` 9 y la deuda de lint existente sin elevar su baseline. Los dos
overrides de minimatch 11.0.5 están limitados a los consumidores ESLint y
typescript-estree. Sus llamadas usan la API compatible `minimatch(path, glob,
{dot:true})`; dos pruebas ejecutan los paquetes realmente resueltos y casos
de inclusión/exclusión. No hay `--force` ni cambio de dependencias productivas.

Evidencia local: 48 unitarias; batería de seguridad de navegador con 142 casos
y repetición de preflight de 14 casos (10 anteriores y cuatro nuevos). Las
respuestas de API son interceptadas: no representan accesos Google ni envíos
SES reales. Se conservan los cuatro fallos iniciales de la nueva UI y su
corrección, además del resultado final. Compilación y CSS satisfactorios;
lint estricto cero y deuda general 310 sin aumento. npm audit completo y
runtime: cero avisos conocidos. El informe administrativo de etapa 8 contiene
los pasos manuales y la comprobación de la imagen construida.

No se modifican los tres modales POS excluidos, ni se incorpora etapa 7, ni
se configura el proveedor o el servidor del propietario.

Se añaden COOP/CORP `same-origin` al generador de cabeceras Nginx y se
comprueban en las dos pruebas permanentes de la imagen web. ZAP pasivo local
se ejecutó: sin alertas altas; permanecen advertencia media de estilos inline
y baja de COEP, además de avisos informativos. No se suprimen reglas ni se
anuncia salida limpia (baseline devuelve 2). Eliminar estilos inline requiere
revisar componentes y bibliotecas; imponer COEP requiere probar recursos
externos. No se consideran aceptaciones de riesgo automáticas ni pentest
autenticado. Las cabeceras deben replicarse y probarse si el hosting cambia.
