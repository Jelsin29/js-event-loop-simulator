import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventLoopEngine,
  OperationType,
} from '../src/event-loop';
import type {
  ScriptOperation,
  Script,
  ExecutionStep,
  ExecutionStepType,
  EventLoopState,
} from '../src/event-loop';
import { CallStack, StackFrame } from '../src/call-stack';
import { MicrotaskQueue, MacrotaskQueue, TimerRegistry } from '../src/task-queue';

describe('OperationType', () => {
  it('should have all operation type constants', () => {
    expect(OperationType.Call).toBe('call');
    expect(OperationType.Return).toBe('return');
    expect(OperationType.Log).toBe('log');
    expect(OperationType.SetTimeout).toBe('setTimeout');
    expect(OperationType.Promise).toBe('promise');
    expect(OperationType.Microtask).toBe('microtask');
  });
});

describe('ScriptOperation', () => {
  it('should allow creating a log operation', () => {
    const op: ScriptOperation = {
      type: OperationType.Log,
      name: 'scriptStart',
      value: 'script start',
    };
    expect(op.type).toBe('log');
    expect(op.name).toBe('scriptStart');
    expect(op.value).toBe('script start');
  });

  it('should allow creating a setTimeout operation', () => {
    const op: ScriptOperation = {
      type: OperationType.SetTimeout,
      name: 'timer1',
      delay: 0,
      children: [],
    };
    expect(op.type).toBe('setTimeout');
    expect(op.delay).toBe(0);
  });

  it('should allow creating a promise operation', () => {
    const thenCallback: ScriptOperation = {
      type: OperationType.Log,
      name: 'promise1',
      value: 'promise1',
    };
    const op: ScriptOperation = {
      type: OperationType.Promise,
      name: 'promiseRes1',
      children: [thenCallback],
    };
    expect(op.type).toBe('promise');
    expect(op.children).toHaveLength(1);
  });
});

describe('EventLoopEngine', () => {
  let engine: EventLoopEngine;

  beforeEach(() => {
    engine = new EventLoopEngine();
  });

  describe('construction', () => {
    it('should create an engine with default components', () => {
      expect(engine.callStack).toBeInstanceOf(CallStack);
      expect(engine.microtaskQueue).toBeInstanceOf(MicrotaskQueue);
      expect(engine.macrotaskQueue).toBeInstanceOf(MacrotaskQueue);
      expect(engine.timerRegistry).toBeInstanceOf(TimerRegistry);
    });

    it('should start with empty call stack', () => {
      expect(engine.callStack.isEmpty()).toBe(true);
    });

    it('should start with empty queues', () => {
      expect(engine.microtaskQueue.isEmpty()).toBe(true);
      expect(engine.macrotaskQueue.isEmpty()).toBe(true);
    });

    it('should start with no execution steps', () => {
      expect(engine.steps).toEqual([]);
    });
  });

  describe('execute - basic script operations', () => {
    it('should execute a single log operation', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'hello', value: 'hello world' },
      ];

      const steps = engine.execute(script);

      expect(steps).toHaveLength(1);
      expect(steps[0]!.type).toBe('log');
      expect(steps[0]!.name).toBe('hello');
      expect(steps[0]!.value).toBe('hello world');
    });

    it('should execute multiple log operations in order', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'first', value: 'first' },
        { type: OperationType.Log, name: 'second', value: 'second' },
      ];

      const steps = engine.execute(script);

      expect(steps).toHaveLength(2);
      expect(steps[0]!.name).toBe('first');
      expect(steps[1]!.name).toBe('second');
    });
  });

  describe('execute - setTimeout scheduling', () => {
    it('should schedule setTimeout(0) as a macrotask, not execute immediately', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'scriptStart', value: 'script start' },
        {
          type: OperationType.SetTimeout,
          name: 'timeout1',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timeoutCallback', value: 'timeout callback' },
          ],
        },
        { type: OperationType.Log, name: 'scriptEnd', value: 'script end' },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      // Script operations run first, timeout callback runs after
      expect(names).toEqual(['scriptStart', 'scriptEnd', 'timeoutCallback']);
    });

    it('should schedule setTimeout with non-zero delay', () => {
      const script: Script = [
        {
          type: OperationType.SetTimeout,
          name: 'delayed',
          delay: 100,
          children: [
            { type: OperationType.Log, name: 'delayedCallback', value: 'delayed' },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual(['delayedCallback']);
    });
  });

  describe('execute - promise microtask scheduling', () => {
    it('should schedule Promise.resolve().then() as a microtask, not execute immediately', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'scriptStart', value: 'script start' },
        {
          type: OperationType.Promise,
          name: 'promise1',
          children: [
            { type: OperationType.Log, name: 'promise1Callback', value: 'promise1' },
          ],
        },
        { type: OperationType.Log, name: 'scriptEnd', value: 'script end' },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual(['scriptStart', 'scriptEnd', 'promise1Callback']);
    });
  });

  describe('execute - microtasks drain before macrotasks', () => {
    it('should drain ALL microtasks before the next macrotask', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'scriptStart', value: 'script start' },
        {
          type: OperationType.SetTimeout,
          name: 'timeout',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timeoutCallback', value: 'timeout' },
          ],
        },
        {
          type: OperationType.Promise,
          name: 'promise1',
          children: [
            { type: OperationType.Log, name: 'promise1Callback', value: 'promise1' },
          ],
        },
        { type: OperationType.Log, name: 'scriptEnd', value: 'script end' },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual([
        'scriptStart',
        'scriptEnd',
        'promise1Callback',
        'timeoutCallback',
      ]);
    });
  });

  describe('execute - nested microtasks drain correctly', () => {
    it('should drain microtasks added during microtask execution (while loop behavior)', () => {
      // Promise.resolve().then(() => {
      //   console.log('promise1');
      //   Promise.resolve().then(() => {
      //     console.log('promise2');
      //   });
      // });
      const script: Script = [
        {
          type: OperationType.Promise,
          name: 'outerPromise',
          children: [
            { type: OperationType.Log, name: 'promise1', value: 'promise1' },
            {
              type: OperationType.Promise,
              name: 'innerPromise',
              children: [
                { type: OperationType.Log, name: 'promise2', value: 'promise2' },
              ],
            },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      // Both microtasks drain before any macrotask
      expect(names).toEqual(['promise1', 'promise2']);
    });

    it('should drain deeply nested microtasks', () => {
      // Three levels of nesting
      const script: Script = [
        {
          type: OperationType.Promise,
          name: 'level1',
          children: [
            { type: OperationType.Log, name: 'log1', value: '1' },
            {
              type: OperationType.Promise,
              name: 'level2',
              children: [
                { type: OperationType.Log, name: 'log2', value: '2' },
                {
                  type: OperationType.Promise,
                  name: 'level3',
                  children: [
                    { type: OperationType.Log, name: 'log3', value: '3' },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual(['log1', 'log2', 'log3']);
    });
  });

  describe('execute - classic Jake Archibald example', () => {
    it('should produce: script start → script end → promise1 → promise2 → timeout', () => {
      // console.log('script start');
      // setTimeout(() => console.log('timeout'), 0);
      // Promise.resolve().then(() => {
      //   console.log('promise1');
      //   Promise.resolve().then(() => console.log('promise2'));
      // });
      // console.log('script end');
      const script: Script = [
        { type: OperationType.Log, name: 'scriptStart', value: 'script start' },
        {
          type: OperationType.SetTimeout,
          name: 'timeout',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timeoutCallback', value: 'timeout' },
          ],
        },
        {
          type: OperationType.Promise,
          name: 'promise1',
          children: [
            { type: OperationType.Log, name: 'promise1', value: 'promise1' },
            {
              type: OperationType.Promise,
              name: 'promise2',
              children: [
                { type: OperationType.Log, name: 'promise2', value: 'promise2' },
              ],
            },
          ],
        },
        { type: OperationType.Log, name: 'scriptEnd', value: 'script end' },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual([
        'scriptStart',
        'scriptEnd',
        'promise1',
        'promise2',
        'timeoutCallback',
      ]);
    });
  });

  describe('step - single-step execution', () => {
    it('should return null when no work to do', () => {
      const step = engine.step();
      expect(step).toBeNull();
    });

    it('should execute one operation per step', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'first', value: 'first' },
        { type: OperationType.Log, name: 'second', value: 'second' },
      ];

      engine.loadScript(script);

      const step1 = engine.step();
      expect(step1).not.toBeNull();
      expect(step1!.name).toBe('first');

      const step2 = engine.step();
      expect(step2).not.toBeNull();
      expect(step2!.name).toBe('second');

      const step3 = engine.step();
      expect(step3).toBeNull();
    });

    it('should run microtask checkpoint between script and macrotask', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'scriptStart', value: 'script start' },
        {
          type: OperationType.SetTimeout,
          name: 'timeout',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timeoutCallback', value: 'timeout' },
          ],
        },
        {
          type: OperationType.Promise,
          name: 'promise1',
          children: [
            { type: OperationType.Log, name: 'promise1Callback', value: 'promise1' },
          ],
        },
        { type: OperationType.Log, name: 'scriptEnd', value: 'script end' },
      ];

      engine.loadScript(script);

      // Script operations
      expect(engine.step()!.name).toBe('scriptStart');
      expect(engine.step()!.name).toBe('scriptEnd');
      expect(engine.step()!.name).toBe('promise1Callback');
      expect(engine.step()!.name).toBe('timeoutCallback');
      expect(engine.step()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear all state including steps', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'test', value: 'test' },
      ];

      engine.execute(script);
      expect(engine.steps.length).toBeGreaterThan(0);

      engine.reset();
      expect(engine.steps).toEqual([]);
      expect(engine.callStack.isEmpty()).toBe(true);
      expect(engine.microtaskQueue.isEmpty()).toBe(true);
      expect(engine.macrotaskQueue.isEmpty()).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return a snapshot of the current state', () => {
      const state: EventLoopState = engine.getState();

      expect(state.callStackSize).toBe(0);
      expect(state.microtaskQueueSize).toBe(0);
      expect(state.macrotaskQueueSize).toBe(0);
      expect(state.timerCount).toBe(0);
      expect(state.stepsCount).toBe(0);
    });

    it('should reflect state after executing a script', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'hello', value: 'hello' },
      ];
      engine.execute(script);

      const state = engine.getState();
      expect(state.stepsCount).toBe(1);
      expect(state.callStackSize).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty script', () => {
      const steps = engine.execute([]);
      expect(steps).toEqual([]);
    });

    it('should handle multiple setTimeouts in order', () => {
      const script: Script = [
        {
          type: OperationType.SetTimeout,
          name: 'timer1',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timer1Callback', value: 'timer1' },
          ],
        },
        {
          type: OperationType.SetTimeout,
          name: 'timer2',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timer2Callback', value: 'timer2' },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual(['timer1Callback', 'timer2Callback']);
    });

    it('should handle microtasks enqueued during another microtask before macrotask', () => {
      // setTimeout callback that enqueues a microtask
      const script: Script = [
        {
          type: OperationType.SetTimeout,
          name: 'timeout',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timeoutLog', value: 'timeout' },
            {
              type: OperationType.Promise,
              name: 'promiseInTimeout',
              children: [
                { type: OperationType.Log, name: 'promiseAfterTimeout', value: 'after timeout' },
              ],
            },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      // Microtask within a macrotask should still drain before next macrotask
      expect(names).toEqual(['timeoutLog', 'promiseAfterTimeout']);
    });

    it('should interleave macrotasks with their microtasks correctly', () => {
      const script: Script = [
        {
          type: OperationType.SetTimeout,
          name: 'timer1',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timer1', value: '1' },
            {
              type: OperationType.Promise,
              name: 'promiseInTimer1',
              children: [
                { type: OperationType.Log, name: 'promiseInTimer1', value: 'p1' },
              ],
            },
          ],
        },
        {
          type: OperationType.SetTimeout,
          name: 'timer2',
          delay: 0,
          children: [
            { type: OperationType.Log, name: 'timer2', value: '2' },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      // timer1 runs → its microtask drains → timer2 runs
      expect(names).toEqual(['timer1', 'promiseInTimer1', 'timer2']);
    });
  });

  describe('call and return operations', () => {
    it('should track function calls on the call stack', () => {
      const script: Script = [
        {
          type: OperationType.Call,
          name: 'greet',
          children: [
            { type: OperationType.Log, name: 'helloLog', value: 'hello' },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual(['greet', 'helloLog', 'returnFrom_greet']);
    });

    it('should handle nested function calls', () => {
      const script: Script = [
        {
          type: OperationType.Call,
          name: 'outer',
          children: [
            {
              type: OperationType.Call,
              name: 'inner',
              children: [
                { type: OperationType.Log, name: 'deepLog', value: 'deep' },
              ],
            },
          ],
        },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual([
        'outer',
        'inner',
        'deepLog',
        'returnFrom_inner',
        'returnFrom_outer',
      ]);
    });
  });

  describe('microtask operation', () => {
    it('should enqueue a standalone microtask that runs after script', () => {
      const script: Script = [
        { type: OperationType.Log, name: 'start', value: 'start' },
        {
          type: OperationType.Microtask,
          name: 'queueMicrotask',
          children: [
            { type: OperationType.Log, name: 'microtaskLog', value: 'microtask' },
          ],
        },
        { type: OperationType.Log, name: 'end', value: 'end' },
      ];

      const steps = engine.execute(script);
      const names = steps.map((s) => s.name);

      expect(names).toEqual(['start', 'end', 'microtaskLog']);
    });
  });
});