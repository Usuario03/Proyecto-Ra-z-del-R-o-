---
description: SDD · Ejecuta una sola tarea aprobada; uso ID Tn.
agent: coordinator
---
Usa sdd. Spec: $1. Tarea única: $2.
Lee spec/plan/tasks de specs/$1/; comprueba aprobaciones y dependencias. Delega únicamente $2 a implementer.
Solicita evidencia de comprobaciones pertinentes, actualización de esa tarea y MEMORY.md. Devuelve resultado y detente sin ejecutar otra tarea.
Si falta una decisión, informa bloqueo. No declares validada toda la spec con la entrega del implementador.
