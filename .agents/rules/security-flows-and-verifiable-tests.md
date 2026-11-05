---
trigger: model_decision
description: Al implementar o probar login, sesiones, MFA, step-up, recuperación, permisos, administración sensible y configuración de seguridad frontend.
---

# Flujos de seguridad y pruebas verificables

## Contratos y responsabilidades

- Leer revisión/ADR y verificar controller/DTO/cliente/caller actual. No inventar rutas,
  errores, estados ni datos a partir del nombre de una interfaz. No basta crear un componente sin montarlo.
- Backend decide estado, autorización, intención, factor, TTL y tenant/objeto. React mejora
  UX; no reemplaza controles. No duplicar reglas empresariales complejas ni confiar en roles locales.
- Servicios HTTP y hooks orquestan; páginas presentan. UI Kit sin negocio; TypeScript estricto,
  sin any. Lucide, componentes y diccionarios existentes; no rediseñar el producto para añadir MFA.
- Código/funciones/variables/logs en inglés; comentarios necesarios en español; UI en español
  breve y por códigos estables de API. No comparar frases ni mostrar message técnico crudo.

## Estados y credenciales

- Distinguir MFA_PENDING, enrolamiento requerido y recuperación restringida. No pedir un
  código de factor que no existe ni tratar token nulo como fallo genérico o sesión completa.
- No montar negocio/menús/querys privadas/SSE antes de garantía completa. Guards no son la
  prueba del servidor: añadir llamadas HTTP negativas al plan de pruebas backend.
- Access token solo en memoria; refresh en cookie según contrato, con CSRF/Origin/credenciales
  configuradas por ambiente. No secretos VITE_ ni URLs de seguridad construidas desde Host no confiable.
- Un error de OTP/step-up no equivale a sesión expirada. Diferenciar 401/403/429/503 por códigos;
  no logout indiscriminado ni reintento automático de una mutación con otra identidad.
- Vínculo generation/sessionId al capturar intención, esperar autorización y enviar mutación.
  Limpiar/rechazar promesas pendientes al cambiar sesión o desmontar; evitar doble submit y callbacks viejos.
- No bearer/grant/OTP/semilla/QR/backup en localStorage/sessionStorage/URL/query cache ni logs.
  No console.error de AxiosError/config/headers que contengan credenciales. No guardarlos en capturas/reportes.
- QR se renderiza localmente; jamás Cloudinary, Google Charts, Print-Agent o servicio QR externo.
  Material solo durante ceremonia autorizada; cierre/expiración limpia vista y estado sensible.
- Email verificado no es prerrequisito nuevo para MFA opt-in ni para ERP rutinario.

## UI integrada y operación

- Usar ComerziaModal/ComerziaInput/CrudButtons. No resolver overlays con z-index arbitrarios
  por debajo de modales existentes. Probar encima del editor, en móvil, teclado y temas.
- No mostrar IDs, companyId, keyId, hashes ni datos de auditoría como contenido de usuario.
  Referencias opacas solo en transporte cuando el contrato las requiere.
- Capturar datos de operación antes de step-up y no cambiar silenciosamente la intención
  aprobada. Enviar contrato completo; el backend calcula y verifica su digest/target.
- Política/diagnóstico: no true por defecto ni READY inventado. Mostrar UNKNOWN/NOT_READY
  sin traducirlos a permiso. No activar producción porque se ve un switch funcionando.
- Recorrido completo: botón → autorización → petición → estado persistido → respuesta/errores.
  Una API nueva sin UI accesible o un componente sin consumidor no son funcionalidad terminada.

## Tests, dependencias y reportes

- Tests importan producción o montan componentes/store/cliente reales. No copiar validadores
  ni arrays de estados dentro del test y presentarlos como cobertura del sistema.
- Playwright con API interceptada prueba UI, no autenticidad TOTP, guardas Spring o MySQL.
  Separar E2E real y manual con autenticador físico. No inventar recepción de correo ni usar fixtures como prueba externa.
- Probar estados limitados, cancelación, errores OTP sin logout, cuenta sin permiso, red lenta,
  recarga, dos pestañas, cambio de identidad, limpieza de caché y no envío previo a autorización.
- Mantener tests oficiales y fallos históricos. Cambiar fixtures por contrato nuevo con
  explicación y aserción equivalente; no reducir entropía, quitar guardas o borrar assertions para pasar.
- Verificar código/imagen servidos antes de anunciar Docker validado. Health/build no sustituyen E2E.
- SCA completo y productivo separados. Verificar versiones GA compatibles, mantenimiento,
  licencia y lockfiles antes de instalar. No npm audit fix --force, overrides mayores generales,
  downgrades automáticos ni cambiar DaisyUI/Tailwind para ocultar un problema de seguridad.
- Conservar logs/JSON/exit/fecha/skips y artefacto, sin secretos. No sumar repetición dirigida
  como suite completa ni atribuir resultados históricos al código final modificado.
- Actualizar única bitácora del encargo, con límites/riesgos. LISTO_PARA_REVISION no es APROBADO;
  revisión independiente y aceptación del propietario siguen siendo necesarias.
