import { describe, it, expect } from 'vitest';
import { Visualizer } from '../src/visualizer';
import { EventLoopEngine, OperationType } from '../src/event-loop';
import type { ExecutionStep } from '../src/event-loop';

// Helper: build steps from overrides, preserving ExecutionStep shape
function makeSteps(overrides: Partial<ExecutionStep>[]): ExecutionStep[] {
  return overrides.map((o, i) => ({
    type: o.type ?? 'log',
    name: o.name ?? `step${i}`,
    value: o.value,
    timestamp: o.timestamp ?? i,
    details: o.details,
  }));
}

describe('Visualizer', () => {
  describe('construction', () => {
    it('should accept an array of ExecutionSteps', () => {
      const steps = makeSteps([
        { type: 'log', name: 'scriptStart', value: 'script start' },
      ]);
      const viz = new Visualizer(steps);
      expect(viz).toBeInstanceOf(Visualizer);
    });

    it('should start at step index -1 (show all)', () => {
      const steps = makeSteps([
        { type: 'log', name: 'a', value: 'a' },
        { type: 'log', name: 'b', value: 'b' },
      ]);
      const viz = new Visualizer(steps);
      // -1 means "show all steps", not limited to a partial view
      expect(viz.currentStepIndex).toBe(-1);
    });
  });

  describe('renderCallStack()', () => {
    it('should show (empty) when no function calls in steps', () => {
      const steps = makeSteps([
        { type: 'log', name: 'hello', value: 'hello world' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderCallStack();
      expect(output).toContain('Call Stack:');
      expect(output).toContain('(empty)');
    });

    it('should show frames when functionCall steps exist', () => {
      const steps = makeSteps([
        { type: 'functionCall', name: 'main()' },
        { type: 'functionCall', name: 'foo()' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderCallStack();
      expect(output).toContain('main()');
      expect(output).toContain('foo()');
    });

    it('should pop frames on functionReturn', () => {
      const steps = makeSteps([
        { type: 'functionCall', name: 'main()' },
        { type: 'functionCall', name: 'foo()' },
        { type: 'functionReturn', name: 'returnFrom_foo' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderCallStack();
      // foo() was called then returned — only main() remains on stack
      expect(output).toContain('main()');
      expect(output).not.toContain('foo()');
    });
  });

  describe('renderMicrotaskQueue()', () => {
    it('should show (empty) when no microtasks in steps', () => {
      const steps = makeSteps([
        { type: 'log', name: 'test', value: 'test' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderMicrotaskQueue();
      expect(output).toContain('Microtask Queue:');
      expect(output).toContain('(empty)');
    });

    it('should show microtask names when present', () => {
      const steps = makeSteps([
        { type: 'log', name: 'start', value: 'start' },
        { type: 'microtaskScheduled', name: 'promise1', details: { queueType: 'microtask' } },
        { type: 'microtaskScheduled', name: 'promise2', details: { queueType: 'microtask' } },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderMicrotaskQueue();
      expect(output).toContain('promise1');
      expect(output).toContain('promise2');
    });
  });

  describe('renderMacrotaskQueue()', () => {
    it('should show (empty) when no macrotasks in steps', () => {
      const steps = makeSteps([
        { type: 'log', name: 'test', value: 'test' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderMacrotaskQueue();
      expect(output).toContain('Macrotask Queue:');
      expect(output).toContain('(empty)');
    });

    it('should show macrotask names when present', () => {
      const steps = makeSteps([
        { type: 'macrotaskStart', name: 'setTimeout callback' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderMacrotaskQueue();
      expect(output).toContain('setTimeout callback');
    });
  });

  describe('renderTimerRegistry()', () => {
    it('should show (none) when no timers', () => {
      const steps = makeSteps([
        { type: 'log', name: 'test', value: 'test' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderTimerRegistry();
      expect(output).toContain('Timers:');
      expect(output).toContain('(none)');
    });

    it('should show timer details when present', () => {
      const steps = makeSteps([
        { type: 'timerScheduled', name: 'timeout', details: { delay: 0, remaining: 0 } },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderTimerRegistry();
      expect(output).toContain('setTimeout');
      expect(output).toContain('0ms');
    });
  });

  describe('renderExecutionLog()', () => {
    it('should render log steps with value', () => {
      const steps = makeSteps([
        { type: 'log', name: 'scriptStart', value: 'script start' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderExecutionLog();
      expect(output).toContain('=== Execution Log ===');
      expect(output).toContain('[0] log: "script start"');
    });

    it('should render functionCall steps', () => {
      const steps = makeSteps([
        { type: 'functionCall', name: 'foo()' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderExecutionLog();
      expect(output).toContain('[0] call: foo()');
    });

    it('should render functionReturn steps', () => {
      const steps = makeSteps([
        { type: 'functionReturn', name: 'returnFrom_foo' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderExecutionLog();
      expect(output).toContain('[0] return: returnFrom_foo');
    });

    it('should render mixed step types in order', () => {
      const steps = makeSteps([
        { type: 'log', name: 'scriptStart', value: 'script start' },
        { type: 'functionCall', name: 'foo()' },
        { type: 'log', name: 'insideFoo', value: 'inside foo' },
        { type: 'functionReturn', name: 'returnFrom_foo' },
        { type: 'log', name: 'scriptEnd', value: 'script end' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderExecutionLog();
      expect(output).toContain('[0] log: "script start"');
      expect(output).toContain('[1] call: foo()');
      expect(output).toContain('[2] log: "inside foo"');
      expect(output).toContain('[3] return: returnFrom_foo');
      expect(output).toContain('[4] log: "script end"');
    });
  });

  describe('renderState()', () => {
    it('should combine all sections with headers', () => {
      const steps = makeSteps([
        { type: 'log', name: 'test', value: 'test' },
      ]);
      const viz = new Visualizer(steps);
      const output = viz.renderState();
      expect(output).toContain('=== Event Loop State ===');
      expect(output).toContain('Call Stack:');
      expect(output).toContain('Microtask Queue:');
      expect(output).toContain('Macrotask Queue:');
      expect(output).toContain('Timers:');
    });
  });

  describe('step navigation', () => {
    it('should move to next step with nextStep()', () => {
      const steps = makeSteps([
        { type: 'log', name: 'first', value: 'first' },
        { type: 'log', name: 'second', value: 'second' },
        { type: 'log', name: 'third', value: 'third' },
      ]);
      const viz = new Visualizer(steps);
      expect(viz.currentStepIndex).toBe(-1);

      viz.nextStep();
      expect(viz.currentStepIndex).toBe(0);
      // Only first step visible
      expect(viz.renderExecutionLog()).toContain('[0]');
      expect(viz.renderExecutionLog()).not.toContain('[1]');

      viz.nextStep();
      expect(viz.currentStepIndex).toBe(1);
      expect(viz.renderExecutionLog()).toContain('[0]');
      expect(viz.renderExecutionLog()).toContain('[1]');
    });

    it('should jump to specific index with stepTo()', () => {
      const steps = makeSteps([
        { type: 'log', name: 'a', value: 'a' },
        { type: 'log', name: 'b', value: 'b' },
        { type: 'log', name: 'c', value: 'c' },
      ]);
      const viz = new Visualizer(steps);
      viz.stepTo(2);
      expect(viz.currentStepIndex).toBe(2);
    });

    it('should reset to full view', () => {
      const steps = makeSteps([
        { type: 'log', name: 'a', value: 'a' },
        { type: 'log', name: 'b', value: 'b' },
      ]);
      const viz = new Visualizer(steps);
      viz.nextStep();
      expect(viz.currentStepIndex).toBe(0);
      viz.reset();
      expect(viz.currentStepIndex).toBe(-1);
      // Full view shows all steps
      expect(viz.renderExecutionLog()).toContain('[0]');
      expect(viz.renderExecutionLog()).toContain('[1]');
    });
  });

  describe('integration with engine', () => {
    it('should visualize the classic Jake Archibald example', () => {
      const engine = new EventLoopEngine();
      const script = [
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

      const steps = engine.execute(script as any);
      const viz = new Visualizer(steps);

      const log = viz.renderExecutionLog();
      expect(log).toContain('script start');
      expect(log).toContain('script end');
      expect(log).toContain('promise1');
      expect(log).toContain('promise2');
      expect(log).toContain('timeout');
    });
  });
});