# Tasks: Milestone 4 - Event Loop Visualizer

## Phase 1: Type Definitions & Infrastructure

- [x] 1.1 Add ExecutionStep import to `src/index.ts` (if needed for Visualizer)
- [x] 1.2 Create `src/visualizer.ts` with VisualizerOptions interface

## Phase 2: Core Implementation

- [x] 2.1 Implement Visualizer class constructor accepting ExecutionStep[]
- [x] 2.2 Implement renderCallStack() with ASCII box-drawing
- [x] 2.3 Implement renderMicrotaskQueue() showing pending microtasks
- [x] 2.4 Implement renderMacrotaskQueue() showing pending macrotasks
- [x] 2.5 Implement renderTimerRegistry() showing active timers
- [x] 2.6 Implement renderState() combining all four components
- [x] 2.7 Implement renderExecutionLog() showing step index, type, name, value
- [x] 2.8 Implement step navigation: stepTo(), nextStep(), reset()
- [x] 2.9 Export Visualizer from `src/index.ts`

## Phase 3: Testing (TDD)

- [x] 3.1 Write test: renderCallStack() outputs correct format for empty stack
- [x] 3.2 Write test: renderCallStack() outputs correct format with frames
- [x] 3.3 Write test: renderMicrotaskQueue() for empty queue
- [x] 3.4 Write test: renderMicrotaskQueue() for pending microtasks
- [x] 3.5 Write test: renderMacrotaskQueue() for empty queue
- [x] 3.6 Write test: renderMacrotaskQueue() for pending macrotasks
- [x] 3.7 Write test: renderTimerRegistry() for no timers
- [x] 3.8 Write test: renderTimerRegistry() for active timers
- [x] 3.9 Write test: renderExecutionLog() for various step types
- [x] 3.10 Write test: renderState() combines all sections

## Phase 4: Demo & Integration

- [x] 4.1 Create `demos/jake-archibald.ts` with classic example script
- [x] 4.2 Import EventLoopEngine and Script DSL types
- [x] 4.3 Build demo script: console.log("script start"), setTimeout, Promise, etc.
- [x] 4.4 Connect demo to Visualizer and output renderExecutionLog()
- [x] 4.5 Verify demo output shows correct execution order

## Phase 5: Polish

- [x] 5.1 Add JSDoc comments to all Visualizer public methods
- [x] 5.2 Verify all tests pass with `npm test`
- [x] 5.3 Review output format matches spec examples