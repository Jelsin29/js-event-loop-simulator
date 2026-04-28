# Proposal: Milestone 4 - Event Loop Visualizer

## Intent

Implementar un Visualizer que renderiza el estado del event loop en formato ASCII para terminal. Este milestone permite VER el comportamiento del simulador — muestra step-by-step qué hay en el call stack, qué microtasks/macrotasks están pendientes, y el log de ejecución completo.

## Scope

### In Scope
- **Visualizer Class**: Clase que recibe `EventLoopEngine` o `ExecutionStep[]`
  - Constructor acepta engine steps o engine instance
  - `renderCallStack()`: Muestra frames actuales del stack
  - `renderMicrotaskQueue()`: Muestra microtasks pendientes
  - `renderMacrotaskQueue()`: Muestra macrotasks pendientes
  - `renderTimerRegistry()`: Muestra timers activos con tiempo restante
  - `renderState()`: Renderiza estado completo en un punto
  - `renderExecutionLog()`: Muestra todos los steps en orden
- **ASCII Art Output**: Formatovisual para terminal
- **Demo Script**: Ejemplo clásico Jake Archibald con output visual
- **Unit Tests**: Tests para formatting del output

### Out of Scope
- UI web/HTML — solo output ASCII para terminal
- Animación interactive — output estático
- Streaming de steps — solo render completo

## Approach

1. **Visualizer Class**: Acepta `ExecutionStep[]` del engine, renderiza estado actual
2. **Step Index Tracking**: Mantiene índice para mostrar estado en cada punto
3. **ASCII Box Drawing**: Usar caracteres box-drawing (┌─┐│└┘) para estética terminal
4. **Demo Integration**: Importar script existente del milestone-3, pasar al visualizer

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/visualizer.ts` | New | Visualizer class + rendering methods |
| `tests/visualizer.test.ts` | New | Unit tests para formatting |
| `demos/jake-archibald.ts` | New | Demo script con ejemplo clásico |
| `src/index.ts` | Modified | Export Visualizer |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Formato ASCII inconsistente | Low | Tests verifican output exacto |
| Demo muy largo | Medium | Limitar a pasos esenciales |

## Rollback Plan

- Eliminar `src/visualizer.ts`, `tests/visualizer.test.ts`, `demos/jake-archibald.ts`
- Revertir `src/index.ts` si se agregaron exports

## Dependencies

- `src/event-loop.ts` (existing - EventLoopEngine, ExecutionStep)
- `src/call-stack.ts` (existing)
- `src/task-queue.ts` (existing)

## Success Criteria

- [ ] Visualizer.renderCallStack() muestra frames en orden (bottom→top)
- [ ] Visualizer.renderMicrotaskQueue() muestra promesas pendientes
- [ ] Visualizer.renderMacrotaskQueue() muestra callbacks de timers
- [ ] Visualizer.renderTimerRegistry() muestra timers con remaining time
- [ ] Visualizer.renderState() combina todos los rendering methods
- [ ] Demo muestra: script start → async start → promise1 → promise2 → timeout → async end
- [ ] Tests passing