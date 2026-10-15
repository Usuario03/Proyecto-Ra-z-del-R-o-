# Trabajo con agentes — SDD ligero

## Arranque
Selecciona Build para una tarea pequeña o `coordinator` para una funcionalidad con SDD.
La configuración del proyecto usa OpenCode V2 y `openai/gpt-6-astra`; no cambia el modelo de una sesión ya seleccionada.
Un comando con modelo explícito sí selecciona ese modelo. Los perfiles fijan Astra medio; planificación técnica puede escalarse explícitamente.
No hace falta un proveedor distinto para cada rol. DeepSeek queda sin configurar hasta confirmar variante/proveedor/cuota.

## Flujo y aprobaciones
1. Planner prepara spec con RF/RNF y preguntas. Reviewer aclara ambigüedades si el alcance lo justifica.
2. El usuario aprueba la revisión concreta de la spec.
3. Planner propone plan y tareas; el usuario aprueba ambos y el alcance a ejecutar.
4. Implementer ejecuta una tarea por llamada, verifica y devuelve control. Coordinator continúa solo dentro del alcance autorizado.
5. Reviewer contrasta código y evidencia con RF/RNF. Máximo dos rondas de corrección antes de pedir decisión.
6. Planner registra el informe de revisión y el cierre documental; la aprobación humana no la puede inventar un agente.

Una petición explícita de implementar una tarea aprobada autoriza esa tarea. No obliga a confirmar cada archivo ya incluido en el plan.
En Plan incorporado se discute en conversación: no escribir specs/docs del repositorio ni delegar esas escrituras. Cambiar de agente para persistirlas.
Los comandos SDD documentales usan coordinator/planner, no el Plan incorporado. Elegirlos implica salir de ese perfil; no usarlos para eludir una restricción activa.

## Fuente de verdad y mantenimiento
- AGENTS: entrada operativa breve. Constitución: principios. Spec: comportamiento. Plan: solución. Tasks: estado y evidencias.
- MEMORY: resumen de continuidad, nunca historial completo. Planner lo actualiza tras fases documentales/cierre; implementer al acabar una tarea o bloquearse.
- Coordinator asigna un escritor documental en cada momento. Reviewer devuelve informe; planner lo conserva sin cambiar el veredicto.
- Cambios de requisitos actualizan spec → plan/tasks → código. El código observado no prueba que un requisito futuro esté satisfecho.
- Cada spec tiene revisión y aprobación explícitas. Modificar su comportamiento invalida la aprobación anterior.

## Contexto y consumo
- No cargar todos los documentos con globs en configuración. Leer MEMORY, constitución, spec activa y rutas pertinentes.
- No adjuntar de nuevo los PDF/tesis a cada subagente: pasar RF, decisiones y referencias a secciones.
- Buscar antes de leer. Excluir de exploraciones rutinarias lockfile, node_modules, .git, dist, .next e informes generados.
- El coordinator resuelve consultas de estado directamente. Delegación para trabajo sustancial, no para leer un archivo pequeño.
- Implementación secuencial. Máximo dos revisiones independientes en paralelo, con archivos/entornos separados cuando ejecuten pruebas.
- Subagentes sin delegación recursiva. Reutilizar su sesión para corregir la misma tarea cuando sea útil.
- Resumen habitual ≤200 palabras: RF/tarea, rutas, comprobaciones, pendientes. Hallazgos necesarios pueden superar ese objetivo.
- `steps` limita pasos por invocación; NO es un límite monetario. Una ejecución cortada se informa como incompleta.
- La compactación automática conserva continuidad; MEMORY y specs permiten retomar en sesión nueva.
- Consultar estadísticas de uso disponibles en OpenCode; registrar costo/tokens solo si hay datos, sin estimaciones inventadas.

## Contrato de delegación
Enviar: fase, spec/revisión, tarea/RF, objetivo, decisiones, archivos de lectura/escritura, dependencias, pruebas y resultado previo relevante.
Recibir: COMPLETADA / BLOQUEADA / INCOMPLETA, rutas, comandos y resultados, riesgos concretos, siguiente acción.
Un reporte de implementación no sustituye la revisión. Distinguir evidencia recibida de comprobaciones ejecutadas por reviewer.
Para revisar una rama con commits incluir diff contra base y archivos nuevos; `git diff` vacío no significa que no haya cambios.

## Verificación proporcional
- Documentación/harness: `npm run harness:check`, enlaces y reglas; no agregar tests que repitan prosa.
- Dominio/autorización: pruebas de comportamiento y regresión; tests primero cuando hay nueva lógica.
- Base de datos: integración con PostgreSQL aislado, restricciones, rollback y concurrencia.
- Interfaz: Playwright/axe y escenarios afectados; MCP de navegador para diagnóstico complementario.
- Integración de código: typecheck, pruebas pertinentes y build. Ampliar pruebas por impacto, no repetir toda la suite por rutina.
- Reviewer: APROBADO, CAMBIOS NECESARIOS o BLOQUEADO / NO VERIFICADO; hallazgos con RF y ruta/línea, mejoras opcionales separadas.

## Herramientas y permisos
Los perfiles limitan edición/delegación y permiten scripts concretos. Shell ejecuta código del repositorio: sus permisos no son un sandbox.
Build/test pueden generar artefactos ignorados y escribir en bases de prueba; reviewer no modifica fuentes ni datos reales.
MCP inicial opcional: Context7 configurado desactivado. Chrome DevTools se incorpora al necesitar diagnóstico visual, fijando una versión comprobada.
Git y Playwright actuales cubren el inicio. Los MCP remotos y servicios externos no se activan al validar el harness.

## Base metodológica y ajustes V2
- Día 1, pp. 15–19: contexto, AGENTS/MEMORY y planificación.
- Día 2, pp. 9–19: spec-anchored, EARS, skills y comandos.
- Día 3, pp. 4–9: cuatro roles, entregas y correcciones acotadas.
- Adaptaciones: pruebas actuales, transacciones PostgreSQL, fechas/UTC diferenciadas y veredicto bloqueado.
- V2: MCP bajo `mcp.servers`; `@ruta` en una plantilla no adjunta archivos: ordenar lectura explícita.
- Argumentos: usar `$1` para ID y `$2` para descripción restante; `$ARGUMENTS` incluye la cadena completa.

Referencias oficiales: [agentes](https://opencode.ai/v2/docs/agents), [comandos](https://opencode.ai/v2/docs/commands), [skills](https://opencode.ai/v2/docs/skills), [permisos](https://opencode.ai/v2/docs/permissions), [MCP](https://opencode.ai/v2/docs/mcp-servers).
