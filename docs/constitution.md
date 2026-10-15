# Constitución — Raíz del Río

1. **Simplicidad:** Next.js API, PostgreSQL y Vercel son el objetivo; módulos claros y dependencias justificadas. Documentar la transición desde Vite.
2. **Spec viva:** cada cambio de comportamiento o contrato corresponde a requisitos verificables; aclarar decisiones pendientes antes de implementarlas.
3. **Autoridad del servidor:** el backend valida identidad, propiedad, precios, inventario y restricciones ambientales; la interfaz comunica resultados.
4. **Integridad:** evitar sobreventa, preservar instantáneas históricas y versionar las migraciones; probar las transacciones con PostgreSQL.
5. **Evidencia reproducible:** versiones declaradas, instalación desde lockfile y verificaciones pertinentes; una prueba no ejecutada nunca cuenta como aprobada.
6. **Claridad e inclusión:** documentación e interfaz en español, identificadores nuevos en inglés, accesibilidad y privacidad preservadas.
