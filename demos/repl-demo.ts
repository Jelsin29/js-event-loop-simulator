/**
 * REPL Demo Script
 *
 * This script demonstrates how to use the REPL programmatically.
 * To run the interactive REPL directly:
 *   npx tsx src/repl.ts
 *
 * This demo shows:
 * 1. Creating a REPL instance
 * 2. Using the parser to convert input to operations
 * 3. Executing through the EventLoopEngine
 * 4. Visualizing results
 */

import { EventLoopEngine, OperationType } from '../src/event-loop.js';
import { Visualizer } from '../src/visualizer.js';
import { InputParser } from '../src/parser.js';

console.log('=== REPL Demo ===\n');
console.log('This demo shows how the REPL processes input.\n');

// Example 1: Using the parser
console.log('--- Example 1: Parsing user input ---');
const parser = new InputParser();

const inputs = [
  'log("hello world")',
  'setTimeout(() => { log("fired") }, 100)',
  'Promise.resolve().then(() => { log("done") })',
];

for (const input of inputs) {
  console.log(`Input: ${input}`);
  const ops = parser.parse(input);
  console.log(`Parsed: ${JSON.stringify(ops, null, 2)}\n`);
}

// Example 2: Executing parsed operations
console.log('--- Example 2: Execute parsed operations ---');
const engine = new EventLoopEngine();

// Build script from parsed operations
const script = [
  { type: OperationType.Log, name: 'start', value: 'script starting' },
  { type: OperationType.SetTimeout, name: 'timeout', delay: 0, children: [
    { type: OperationType.Log, name: 'timeoutCallback', value: 'timeout fired' }
  ]},
  { type: OperationType.Promise, name: 'promise', children: [
    { type: OperationType.Log, name: 'promiseCallback', value: 'promise resolved' }
  ]},
  { type: OperationType.Log, name: 'end', value: 'script ending' },
];

const steps = engine.execute(script);
const viz = new Visualizer(steps);

console.log('Execution log:');
console.log(viz.renderExecutionLog());
console.log('\nFinal state:');
console.log(viz.renderState());

// Example 3: Step-by-step execution
console.log('--- Example 3: Step-by-step mode ---');
const engine2 = new EventLoopEngine();
engine2.loadScript(script);

let stepNum = 0;
let step = engine2.step();
while (step) {
  stepNum++;
  console.log(`Step ${stepNum}: [${step.type}] ${step.name}${step.value ? `: "${step.value}"` : ''}`);
  step = engine2.step();
}

console.log(`\nTotal steps: ${stepNum}`);
console.log('\n=== Demo complete ===');
console.log('\nTo run the interactive REPL:');
console.log('  npx tsx src/repl.ts');
