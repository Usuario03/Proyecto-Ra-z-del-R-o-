# Spec 001 — Harness SDD

Revisión: 1
Estado: en implementación
Aprobación: usuario solicitó ejecutar el harness definido y completar su estructura en esta sesión.
Fuente: apuntes Días 1–3 y decisiones explícitas del usuario (Astra con cuota limitada).

## Contexto y objetivo
Organizar el desarrollo del backend con contexto selectivo, responsabilidades delimitadas y evidencia reproducible.

## Actores
Desarrollador responsable, coordinador, planificador, implementador y revisor.

## Requisitos
- RF-HAR-01: CUANDO comience una tarea, EL AGENTE dispondrá de instrucciones breves y un mapa de contexto relevante.
- RF-HAR-02: CUANDO se solicite una funcionalidad mediante SDD, EL COORDINADOR separará spec, plan/tareas, implementación y revisión con las aprobaciones definidas.
- RF-HAR-03: CUANDO delegue, EL COORDINADOR transmitirá alcance, RF, rutas y evidencia; cada implementador resolverá una tarea.
- RF-HAR-04: CUANDO finalice una tarea/fase, EL RESPONSABLE designado actualizará memoria y estado sin duplicar documentación extensa.
- RF-HAR-05: SI falta evidencia, EL REVISOR informará bloqueo/no verificado en lugar de aprobar.
- RF-HAR-06: CUANDO se consulte estado, EL COORDINADOR responderá sin delegaciones innecesarias.
- RF-HAR-07: EL HARNESS ofrecerá nueve comandos SDD y cuatro skills específicas cargables bajo demanda.

## Requisitos no funcionales
- RNF-HAR-01: AGENTS ≤40 líneas; MEMORY ≤50 líneas.
- RNF-HAR-02: Configuración V2, Astra medio por perfil, límites de pasos y MCP opcional desactivado.
- RNF-HAR-03: Validación estructural sin nuevas dependencias y comandos reproducibles en Windows/CI Linux.

## Fuera de alcance
Implementar/migrar backend, contratar servicios, activar pagos o importar datos locales. Estas decisiones requieren otra spec.

## Criterios de finalización
Archivos enlazados existentes; agentes/comandos/skills coherentes; validación local y build/pruebas actuales correctos.
La disponibilidad en el catálogo se comprueba separadamente de una ejecución real con modelo; no afirmar una simulación multiagente que no se haya ejecutado.

## Dudas abiertas
Ninguna bloqueante para el harness. Decisiones backend en docs/architecture.md.
