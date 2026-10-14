# Preferencias de cobro

Ejecutar `npm run test:checkout`. El arnés monta TerminalPage y CompanyProfilePage con las peticiones API interceptadas; no usa datos ni impresoras reales.

Los 13 escenarios comprueban las cuatro combinaciones de impresión/cliente en desktop y mobile, ausencia de consulta de hardware con impresión desactivada, impresión automática subordinada a la empresa, compatibilidad de perfiles anteriores y guardado de ambos switches sin desbordamiento horizontal en mobile.
