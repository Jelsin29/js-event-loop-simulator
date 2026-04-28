/**
 * Jake Archibald's classic event loop example
 *
 * Demonstrates the execution order:
 *   script start → script end → promise1 → promise2 → timeout
 *
 * This is THE example that confuses everyone learning JS:
 * https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
 *
 * The equivalent JS code:
 *
 *   console.log('script start');
 *   setTimeout(() => console.log('timeout'), 0);
 *   Promise.resolve().then(() => {
 *     console.log('promise1');
 *     Promise.resolve().then(() => console.log('promise2'));
 *   });
 *   console.log('script end');
 */

import { EventLoopEngine, OperationType } from '../src/event-loop.js';
import { Visualizer } from '../src/visualizer.js';

// Build the script using the DSL
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

const engine = new EventLoopEngine();
const steps = engine.execute(script);

const viz = new Visualizer(steps);

console.log('=== Jake Archibald Event Loop Demo ===\n');
console.log(viz.renderExecutionLog());
console.log('\n' + viz.renderState());