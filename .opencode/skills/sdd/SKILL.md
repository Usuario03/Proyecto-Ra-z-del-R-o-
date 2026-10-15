---
name: SDD de Raíz del Río
description: Redactar, aclarar, planificar, implementar o validar specs vivas de Raíz del Río y mantener su trazabilidad.
---
# SDD spec-anchored

Las rutas `docs/`, `specs/`, AGENTS.md y MEMORY.md se refieren a la raíz del repositorio. Las plantillas están en `templates/` junto a esta skill.
Lee docs/constitution.md, MEMORY.md y solo la spec activa. Flujo completo en docs/ai-workflow.md.

## Artefactos y aprobaciones
- spec.md: QUÉ/POR QUÉ, RF/RNF EARS, fuente, aceptación, límites y dudas.
- plan.md: CÓMO, archivos, contratos, datos, decisiones, dependencias y verificaciones.
- tasks.md: tarea/RF, archivos, dependencias, estado y "Hecho cuando".
- validation.md: RF/RNF → evidencia → resultado; revisión/commit y pendientes.
- Aprobar spec y después plan/tareas antes de código. Registrar aprobación real para la revisión concreta.
- Un cambio de requisitos vuelve a spec → plan/tasks → código. Una tarea incompleta o bloqueada no está hecha.
- En Plan incorporado o bajo restricción de solo lectura, devolver propuestas en conversación sin escrituras delegadas.

## Requisitos
Usar CUANDO evento EL SISTEMA respuesta; SI condición ENTONCES respuesta; MIENTRAS estado EL SISTEMA comportamiento.
Una obligación observable por RF. Identificadores estables con prefijo de módulo. No inventar métricas ni requisitos académicos.
Marcar [NECESITA ACLARACIÓN] y preguntar por decisiones de negocio pendientes, hasta cinco preguntas por ronda.
Separar restricciones técnicas aprobadas del diseño propuesto. Los ejemplos del Diario de Estudio no son reglas de este producto.

## Ejecución y cierre
Una tarea por implementador; dividir incrementos demasiado grandes. No imponer estimaciones ficticias de 20 minutos.
Tests primero para reglas nuevas/regresiones; verificaciones proporcionales para configuración y documentación.
Usar scripts existentes, PostgreSQL real para transacciones y Playwright para flujos UI cuando estén disponibles.
Revisar frente a RF/RNF; máximo dos rondas de corrección. Bloqueos vuelven al coordinador/usuario.
Actualizar MEMORY.md con un escritor designado, ≤50 líneas. Guardar evidencias extensas fuera de la memoria.
No leer todas las plantillas: abrir solo la necesaria.
