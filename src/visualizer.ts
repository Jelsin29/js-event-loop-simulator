/**
 * Visualizer for JS Event Loop Simulator
 *
 * Renders ExecutionStep[] as ASCII art for terminal display.
 * Shows call stack, microtask/macrotask queues, timers,
 * and execution log at any point during execution.
 *
 * By default, renders ALL steps (full execution view).
 * Use stepTo()/nextStep() to inspect state at a specific point.
 */

import type { ExecutionStep } from './event-loop.js';
import { ExecutionStepType } from './event-loop.js';

export interface VisualizerOptions {
  showTimestamps?: boolean;
}

export class Visualizer {
  private steps: ExecutionStep[];
  /** Current step index for partial rendering. -1 means show all. */
  currentStepIndex: number;

  constructor(steps: ExecutionStep[], options?: VisualizerOptions) {
    this.steps = [...steps];
    // -1 = show all steps (full execution view)
    this.currentStepIndex = -1;
    // options reserved for future use (timestamps, colors, etc.)
    void (options ?? {});
  }

  /** Get the number of visible steps based on current index */
  private get visibleCount(): number {
    if (this.currentStepIndex === -1) {
      return this.steps.length;
    }
    return this.currentStepIndex + 1;
  }

  /** Iterate over visible steps */
  private get visibleSteps(): ExecutionStep[] {
    return this.steps.slice(0, this.visibleCount);
  }

  nextStep(): void {
    // First call from -1 (show all) → go to step 0
    if (this.currentStepIndex === -1) {
      this.currentStepIndex = 0;
    } else if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex += 1;
    }
  }

  stepTo(index: number): void {
    if (index < 0) {
      this.currentStepIndex = -1;
    } else {
      this.currentStepIndex = Math.min(index, this.steps.length - 1);
    }
  }

  reset(): void {
    this.currentStepIndex = -1;
  }

  renderCallStack(): string {
    const frames: string[] = [];
    let depth = 0;

    for (const step of this.visibleSteps) {
      if (step.type === ExecutionStepType.FunctionCall) {
        frames.push(`[${depth}] ${step.name}`);
        depth += 1;
      } else if (step.type === ExecutionStepType.FunctionReturn) {
        if (depth > 0) {
          depth -= 1;
        }
        frames.pop();
      }
    }

    if (frames.length === 0) {
      return 'Call Stack: (empty)';
    }
    const lines = ['Call Stack:'];
    for (const frame of frames) {
      lines.push(`  ${frame}`);
    }
    return lines.join('\n');
  }

  renderMicrotaskQueue(): string {
    const names: string[] = [];

    for (const step of this.visibleSteps) {
      if (step.type === ExecutionStepType.MicrotaskScheduled && step.name) {
        names.push(step.name);
      }
    }

    if (names.length === 0) {
      return 'Microtask Queue: (empty)';
    }
    return `Microtask Queue: [${names.join(', ')}]`;
  }

  renderMacrotaskQueue(): string {
    const names: string[] = [];

    for (const step of this.visibleSteps) {
      if (step.type === ExecutionStepType.MacrotaskStart && step.name) {
        names.push(step.name);
      }
    }

    if (names.length === 0) {
      return 'Macrotask Queue: (empty)';
    }
    return `Macrotask Queue: [${names.join(', ')}]`;
  }

  renderTimerRegistry(): string {
    const timers: string[] = [];

    for (const step of this.visibleSteps) {
      if (step.type === ExecutionStepType.TimerScheduled) {
        const delay = (step.details?.delay as number) ?? 0;
        const remaining = (step.details?.remaining as number) ?? delay;
        const isInterval = (step.details?.isInterval as boolean) ?? false;
        const timerType = isInterval ? 'setInterval' : 'setTimeout';
        timers.push(`${timerType}(${delay}) - ${remaining}ms remaining`);
      }
    }

    if (timers.length === 0) {
      return 'Timers: (none)';
    }
    return `Timers: ${timers.join(', ')}`;
  }

  renderExecutionLog(): string {
    const lines = ['=== Execution Log ==='];
    const stepTypeLabels: Record<string, string> = {
      [ExecutionStepType.Log]: 'log',
      [ExecutionStepType.FunctionCall]: 'call',
      [ExecutionStepType.FunctionReturn]: 'return',
      [ExecutionStepType.TimerScheduled]: 'timer',
      [ExecutionStepType.MicrotaskScheduled]: 'microtask',
      [ExecutionStepType.MacrotaskStart]: 'macrotask',
      [ExecutionStepType.MacrotaskEnd]: 'macrotask_end',
    };

    for (let i = 0; i < this.visibleCount && i < this.steps.length; i++) {
      const step = this.steps[i]!;
      const label = stepTypeLabels[step.type] ?? step.type;
      // For log steps, show the value; for others, show just the name
      if (step.value !== undefined) {
        lines.push(`[${i}] ${label}: "${step.value}"`);
      } else {
        lines.push(`[${i}] ${label}: ${step.name}`);
      }
    }

    return lines.join('\n');
  }

  renderState(): string {
    const sections = [
      '=== Event Loop State ===',
      this.renderCallStack(),
      this.renderMicrotaskQueue(),
      this.renderMacrotaskQueue(),
      this.renderTimerRegistry(),
    ];
    return sections.join('\n');
  }
}