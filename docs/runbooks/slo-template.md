# Plantilla SLO / alerta (flujos críticos)

Copiar y completar por feature (p. ej. importación, mensajes, pagos). Alineado con `08-analytics-observability.mdc`.

## Identificador

- **Flujo**:
- **Owner**:

## SLI (indicador)

- **Qué medimos** (ej. ratio de `action` con `entity` X con `ok` en metadata, tasa de 5xx en ruta Y, latencia p95 de RPC Z):
- **Fuente** (tabla `user_events`, `system_config_audit`, logs Vercel, métricas de API):

## SLO (objetivo)

- **Ventana** (7 días / 30 días):
- **Objetivo** (ej. ≥ 99 % de éxitos):
- **Error budget** (cuántos fallos aceptables en la ventana):

## Alerta

- **Condición** (umbral + duración):
- **Acción** (qué dashboard o query abrir; qué hacer si confirma incidente):
- **Severidad** (página vs correo vs ticket):

## Runbook en 5 pasos

1.
2.
3.
4.
5.
