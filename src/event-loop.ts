/**
 * Event Loop Engine for JS Event Loop Simulator
 *
 * Orchestrates CallStack, MicrotaskQueue, MacrotaskQueue, and TimerRegistry
 * to simulate JavaScript's event loop behavior:
 *
 * 1. Execute synchronous code (script operations)
 * 2. Drain ALL microtasks — while loop, not just one pass
 * 3. Advance timers, pick up due callbacks → enqueue as macrotasks
 * 4. Execute one macrotask, then drain ALL microtasks again
 * 5. Repeat until all queues are empty
 *
 * Timer callback mapping:
 * TimerRegistry tracks virtual time but its register() takes () => void.
 * We register callbacks that self-enqueue into our macrotask queue
 * when called. This bridges TimerRegistry with our operation-based model.
 */

import { CallStack, StackFrame } from './call-stack.js';
import { MicrotaskQueue, MacrotaskQueue, TimerRegistry } from './task-queue.js';

// ─── Operation Types (DSL) ────────────────────────────────────────────

export const OperationType = {
  Call: 'call',
  Return: 'return',
  Log: 'log',
  SetTimeout: 'setTimeout',
  Promise: 'promise',
  Microtask: 'microtask',
  Await: 'await',
} as const;

export type OperationTypeValue = (typeof OperationType)[keyof typeof OperationType];

// ─── Script DSL ────────────────────────────────────────────────────────

export interface ScriptOperation {
  readonly type: OperationTypeValue;
  readonly name: string;
  readonly args?: unknown[];
  /** Nested operations — callbacks, then-chains, function bodies */
  readonly children?: ScriptOperation[];
  /** Timer delay in ms (for setTimeout) */
  readonly delay?: number;
  /** Value to output (for log operations) */
  readonly value?: string;
}

/** A script is an ordered sequence of operations */
export type Script = ScriptOperation[];

// ─── Execution Step Types ──────────────────────────────────────────────

export const ExecutionStepType = {
  Log: 'log',
  FunctionCall: 'functionCall',
  FunctionReturn: 'functionReturn',
  TimerScheduled: 'timerScheduled',
  MicrotaskScheduled: 'microtaskScheduled',
  MacrotaskStart: 'macrotaskStart',
  MacrotaskEnd: 'macrotaskEnd',
} as const;

export type ExecutionStepTypeValue =
  (typeof ExecutionStepType)[keyof typeof ExecutionStepType];

export interface ExecutionStep {
  readonly type: ExecutionStepTypeValue;
  readonly name: string;
  readonly value?: string;
  readonly timestamp: number;
  readonly details?: Record<string, unknown>;
}

// ─── Engine State ──────────────────────────────────────────────────────

export interface EventLoopState {
  readonly callStackSize: number;
  readonly microtaskQueueSize: number;
  readonly macrotaskQueueSize: number;
  readonly timerCount: number;
  readonly stepsCount: number;
}

// ─── Internal Tracking ─────────────────────────────────────────────────

/** Links a microtask queue slot to its callback operations */
interface MicrotaskEntry {
  readonly operations: ScriptOperation[];
}

/** Links a macrotask queue slot to its callback operations and name */
interface MacrotaskEntry {
  readonly operations: ScriptOperation[];
  readonly name: string;
}

// ─── EventLoopEngine ───────────────────────────────────────────────────

export class EventLoopEngine {
  readonly callStack: CallStack;
  readonly microtaskQueue: MicrotaskQueue;
  readonly macrotaskQueue: MacrotaskQueue;
  readonly timerRegistry: TimerRegistry;

  /** Ordered record of observable execution steps */
  readonly steps: ExecutionStep[];

  /** FIFO alongside microtaskQueue — tracks what each microtask should execute */
  private microtaskOps: MicrotaskEntry[];

  /** FIFO alongside macrotaskQueue — tracks what each macrotask should execute */
  private macrotaskOps: MacrotaskEntry[];

  /** Monotonic counter for step timestamps */
  private tick: number;

  /** Step-mode: pre-computed steps and current position */
  private stepResults: ExecutionStep[];
  private stepIndex: number;

  constructor() {
    this.callStack = new CallStack();
    this.microtaskQueue = new MicrotaskQueue();
    this.macrotaskQueue = new MacrotaskQueue();
    this.timerRegistry = new TimerRegistry();
    this.steps = [];
    this.microtaskOps = [];
    this.macrotaskOps = [];
    this.tick = 0;
    this.stepResults = [];
    this.stepIndex = 0;
  }

  // ─── Public API ──────────────────────────────────────────────────

  /**
   * Execute a full script through the event loop.
   * Returns the ordered list of execution steps (only observable actions).
   */
  execute(script: Script): ExecutionStep[] {
    this.reset();
    this.runFull(script);
    return [...this.steps];
  }

  /**
   * Load a script for single-step execution.
   * Pre-computes all steps, then step() returns one at a time.
   */
  loadScript(script: Script): void {
    this.reset();
    this.runFull(script);
    this.stepIndex = 0;
  }

  /**
   * Return the next execution step in single-step mode.
   * Returns null when there are no more steps.
   */
  step(): ExecutionStep | null {
    if (this.stepIndex < this.stepResults.length) {
      const step = this.stepResults[this.stepIndex]!;
      this.stepIndex += 1;
      return step;
    }
    return null;
  }

  /**
   * Reset all state to a fresh engine.
   */
  reset(): void {
    (this as { callStack: CallStack }).callStack = new CallStack();
    (this as { microtaskQueue: MicrotaskQueue }).microtaskQueue = new MicrotaskQueue();
    (this as { macrotaskQueue: MacrotaskQueue }).macrotaskQueue = new MacrotaskQueue();
    (this as { timerRegistry: TimerRegistry }).timerRegistry = new TimerRegistry();

    this.steps.length = 0;
    this.microtaskOps = [];
    this.macrotaskOps = [];
    this.tick = 0;
    this.stepResults = [];
    this.stepIndex = 0;
  }

  /**
   * Get a snapshot of the current engine state.
   */
  getState(): EventLoopState {
    // After execute(), everything is drained so sizes are 0
    // During step mode, caller should check mid-execution state
    // For timer count, we track it differently since TimerRegistry
    // doesn't expose a count method
    let timerCount = 0;
    try {
      // TimerRegistry doesn't have a size method, but we can check
      // by trying advance(0) + due() — but that would consume timers.
      // Instead, just report 0 since after execute they're all consumed.
      timerCount = 0;
    } catch {
      timerCount = 0;
    }

    return {
      callStackSize: this.callStack.size(),
      microtaskQueueSize: this.microtaskQueue.size(),
      macrotaskQueueSize: this.macrotaskQueue.size(),
      timerCount,
      stepsCount: this.steps.length,
    };
  }

  // ─── Private: Core Event Loop ────────────────────────────────────

  /**
   * Run the full event loop: script → drain microtasks → process macrotasks.
   */
  private runFull(script: Script): void {
    // Phase 1: Run all script operations synchronously
    for (const op of script) {
      this.runOperation(op);
    }

    // Phase 2: Drain ALL microtasks
    this.drainMicrotasks();

    // Phase 3: Process macrotasks one at a time, draining microtasks after each
    this.processMacrotasks();

    // Store steps for step() mode
    this.stepResults = [...this.steps];
  }

  /**
   * Run a single operation. May enqueue microtasks/macrotasks
   * as a side effect but does NOT drain them.
   */
  private runOperation(op: ScriptOperation): void {
    switch (op.type) {
      case OperationType.Log: {
        this.recordStep(ExecutionStepType.Log, op.name, op.value);
        break;
      }

      case OperationType.Call: {
        this.callStack.push(StackFrame.create(op.name, op.args ?? []));
        this.recordStep(ExecutionStepType.FunctionCall, op.name);

        if (op.children) {
          for (const child of op.children) {
            this.runOperation(child);
          }
        }

        this.callStack.pop();
        this.recordStep(ExecutionStepType.FunctionReturn, `returnFrom_${op.name}`);
        break;
      }

      case OperationType.Return: {
        this.recordStep(ExecutionStepType.FunctionReturn, op.name, op.value);
        break;
      }

      case OperationType.SetTimeout: {
        const delay = op.delay ?? 0;
        const children = op.children ?? [];
        const name = op.name;

        // Register with TimerRegistry.
        // When the timer fires, its callback self-enqueues a macrotask.
        this.timerRegistry.register(() => {
          this.macrotaskQueue.enqueue(() => {});
          this.macrotaskOps.push({ operations: children, name });
        }, delay, false);

        // Don't record scheduling as an execution step —
        // it's not an observable action
        break;
      }

      case OperationType.Promise:
      case OperationType.Microtask:
      case OperationType.Await: {
        const children = op.children ?? [];

        // Enqueue a placeholder in MicrotaskQueue
        // (operations are tracked in microtaskOps)
        this.microtaskQueue.enqueue(() => {});
        this.microtaskOps.push({ operations: children });

        // Don't record scheduling as an execution step
        break;
      }
    }
  }

  // ─── Private: Microtask Drain ────────────────────────────────────

  /**
   * Drain ALL microtasks. Uses a while loop because
   * running a microtask can enqueue more microtasks
   * (e.g., Promise.resolve().then(() => Promise.resolve().then(...)))
   */
  private drainMicrotasks(): void {
    while (!this.microtaskQueue.isEmpty()) {
      this.microtaskQueue.dequeue();
      const entry = this.microtaskOps.shift();
      if (entry) {
        for (const op of entry.operations) {
          this.runOperation(op);
        }
      }
    }
  }

  // ─── Private: Macrotask Processing ──────────────────────────────

  /**
   * Process macrotasks one at a time, draining microtasks after each.
   * Continue until both the macrotask queue and timers are exhausted.
   */
  private processMacrotasks(): void {
    for (;;) {
      // Advance virtual time by a large amount to fire all registered timers.
      // Our simulator doesn't model real time — after script + microtask drain,
      // we consider "enough time has passed" for all timers to fire.
      this.timerRegistry.advance(Number.MAX_SAFE_INTEGER);

      // Get all due timer callbacks and call them — they self-enqueue macrotasks
      const dueCallbacks = this.timerRegistry.due();
      for (const cb of dueCallbacks) {
        cb();
      }

      // No more macrotasks → we're done
      if (this.macrotaskQueue.isEmpty()) {
        break;
      }

      // Execute one macrotask
      this.macrotaskQueue.dequeue();
      const entry = this.macrotaskOps.shift();
      if (entry) {
        for (const op of entry.operations) {
          this.runOperation(op);
        }
      }

      // After each macrotask, drain ALL microtasks
      this.drainMicrotasks();
    }
  }

  // ─── Private: Helpers ────────────────────────────────────────────

  private recordStep(
    type: ExecutionStepTypeValue,
    name: string,
    value?: string,
    details?: Record<string, unknown>,
  ): void {
    this.steps.push({
      type,
      name,
      value,
      timestamp: this.tick,
      details,
    });
    this.tick += 1;
  }
}