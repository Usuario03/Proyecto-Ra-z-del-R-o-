# Tareas 001 — Harness SDD

Alcance autorizado: montaje del harness y bases de verificación reproducible, solicitado por el usuario.
Actualización 2026-10-15: VCS-01 publicada en ddc83e0 según implementer; reviewer conjunto APROBADO exclusivamente VCS-01/H1, reproducción limpia Windows acreditada por informe recibido en `../002-migracion-fullstack/validation.md` V7. CI Linux NO VERIFICADO, sin URL/estado; T3/T4 siguen pendientes y spec abierta. T1/T2 marcadas históricamente no implican cierre global. Este cierre documental requiere commit adicional posterior, no se declara publicado.

- [x] T1 — Contexto, constitución y trazabilidad. RF-HAR-01, RF-HAR-04.
  - Archivos: AGENTS.md, MEMORY.md, docs/.
  - Hecho cuando: estado actual/objetivo separados y lectura por tarea documentada.
- [x] T2 — Agentes, comandos y skills. RF-HAR-02, RF-HAR-03, RF-HAR-05, RF-HAR-06, RF-HAR-07.
  - Depende de: T1. Archivos: .opencode/, opencode.jsonc.
  - Hecho cuando: roles, permisos, contexto, aprobaciones y entregas configurados.
- [ ] T3 — Validación, versiones y CI. RNF-HAR-01, RNF-HAR-02, RNF-HAR-03.
  - Depende de: T2. Archivos: scripts/, package.json/lock, .nvmrc, .npmrc, .github/workflows/.
  - Hecho cuando: check de harness/entorno, unitarias, tipos y build pasan; registrar límites de validación runtime.
- [ ] T4 — Cierre y guía de uso. RF-HAR-04, RF-HAR-05.
  - Depende de: T3. Archivos: README.md, validation.md y MEMORY.md.
  - Hecho cuando: evidencia registrada y siguiente paso inequívoco para coordinator.
