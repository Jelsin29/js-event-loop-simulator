# Proposal: Milestone 3 - Event Loop Engine

## Intent

Implementar el EventLoopEngine que coordina CallStack, MicrotaskQueue, MacrotaskQueue y TimerRegistry. Este milestone es el corazón del simulador — reproduce el comportamiento real del event loop de JavaScript: ejecutar código síncrono, encolar microtasks, drenar TODOS los microtasks antes de ejecutar macrotasks, y continuar hasta que todas las colas estén vacías.

## Scope

### In Scope
- **Operation DSL Types**: `Script` y `Operation` tipos para representar snippets de código
- **ExecutionStep Type**: Registro de cada paso de ejecución para visualización
- **EventLoopEngine Class**: Clase principal que coordina todas las colas
  - `callStack`: CallStack instance
  - `microtaskQueue`: MicrotaskQueue instance
  - `macrotaskQueue`: MacrotaskQueue instance
  - `timerRegistry`: TimerRegistry instance
  - `execute(script: Script)`: Ejecuta secuencia completa de operaciones
  - `step()`: Modo single-step para debugging
  - `reset()`: Limpia todo el estado
  - `getState()`: Inspecta estado actual
- **Demo Script**: Caso clásico Promise.resolve().then() vs setTimeout()

### Out of Scope
- Visualización UI/web — solo el engine core
- setInterval support detallado (TimerRegistry lo tiene pero demo no lo usa)
- async/await syntax sugar — solo operaciones primitivas

## Approach

1. **Operation DSL**: Definir tipos `Operation` (exec, setTimeout, promiseThen, promiseResolve) y `Script` como array de Operations
2. **ExecutionStep**: Enum de tipos de paso + datos relevantes (función ejecutada, timer ID, etc.)
3. **EventLoopEngine.execute()**:
   - Itera sobre operaciones del script
   - Para cada operación: la ejecuta o la encola según tipo
   - Después del script: WHILE loop drenando TODOS los microtasks
   - Luego: procesar timers debido → encolarlos como macrotasks
   - Ejecutar macrotasks (uno por tick)
   - Continuar hasta todo vacío
4. **Single-step mode**: `step()` ejecuta un solo "tick" del event loop para debugging

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/event-loop-engine.ts` | New | EventLoopEngine class + types |
| `tests/event-loop-engine.test.ts` | New | Tests TDD-first |
| `src/index.ts` | Modified | Export EventLoopEngine |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| While loop infinite en microtasks | Low | Test con nested promises asegura termination |
| Orden de ejecución confuso | Medium | ExecutionStep registra cada acción claramente |

## Rollback Plan

- Eliminar `src/event-loop-engine.ts` y tests asociados
- Revertir `src/index.ts` si se agregaron exports

## Dependencies

- `src/call-stack.ts` (existing)
- `src/task-queue.ts` (existing)

## Success Criteria

- [ ] `execute()` corre script completo hasta completion
- [ ] setTimeout(0) schedules macrotask (no ejecución inmediata)
- [ ] Promise.resolve().then() schedules microtask (no ejecución inmediata)
- [ ] Microtasks drenan ANTES del siguiente macrotask
- [ ] Nested microtasks drenan completamente (while loop behavior)
- [ ] Demo: script start → script end → promise1 → promise2 → setTimeout
- [ ] Tests passing