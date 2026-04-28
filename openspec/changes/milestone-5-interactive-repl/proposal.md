# Proposal: Milestone 5 - Interactive REPL

## Intent

Add a command-line REPL that lets users type real JavaScript code and watch it execute step-by-step with ASCII visualization. Currently users can only run pre-written demo scripts. The REPL makes this an active learning tool instead of a passive demo viewer.

## Scope

### In Scope
- REPL class with read-eval-print loop using Node.js `readline`
- Parse user input into Script DSL operations
- Connect REPL to existing EventLoopEngine + Visualizer
- Step-by-step execution with ENTER key advancement
- Commands: `.step`, `.state`, `.reset`, `.help`, `.exit`
- Demo mode: run pre-loaded examples with explanations

### Out of Scope
- Full JavaScript parser (only support core event loop ops: log, setTimeout, Promise, async/await)
- Interactive TUI with arrow keys (basic line input only)
- File-based script loading
- Syntax highlighting

## Approach

1. **Input Parser**: Convert string input into DSL operations:
   - `"console.log(x)"` → `Script.log(value)`
   - `"setTimeout(fn, delay)"` → `Script.setTimeout(fn, delay)`
   - `"Promise.resolve().then(fn)"` → `Script.promise(fn)`
   - `"await expr"` → `Script.await(expr)`

2. **REPL Loop**:
   ```
   > console.log("hello")
   [ENTER]
   → Execute, show step, pause for next input
   > setTimeout(() => log("hi"), 0)
   [ENTER]
   → Show scheduled, then at next ENTER drain microtasks
   ```

3. **Integration**: Chain existing components:
   ```
   REPL → Script DSL → EventLoopEngine → ExecutionStep[] → Visualizer
   ```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/repl.ts` | New | REPL class with readline interface |
| `src/parser.ts` | New | Convert JS-like syntax to Script DSL |
| `demos/repl-demo.ts` | New | Demo script showing REPL usage |
| `README.md` | Modified | Document REPL usage |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Parser complexity underestimated | Medium | Start with minimal set, expand gradually |
| readline edge cases | Low | Use async iterator pattern for line reading |

## Rollback Plan

Delete `src/repl.ts`, `src/parser.ts`, `demos/repl-demo.ts`. Revert README additions. All new files.

## Dependencies

- Node.js `readline` module (built-in)
- Existing `EventLoopEngine`, `Script`, `Visualizer`

## Success Criteria

- [ ] REPL accepts user input via readline
- [ ] Typed `console.log("x")` produces log output
- [ ] Typed `setTimeout(() => log("x"), 0)` schedules macrotask
- [ ] Typed `Promise.resolve().then(() => log("x"))` schedules microtask
- [ ] Visualizer renders state at each step
- [ ] `.help` shows available commands
- [ ] `.exit` cleanly terminates REPL
- [ ] All 124 existing tests still pass
