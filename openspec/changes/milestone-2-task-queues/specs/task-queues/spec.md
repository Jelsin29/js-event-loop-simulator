# Task Queues Specification

## Purpose

This spec defines the queue data structures that implement JavaScript's asynchronous execution model: the MicrotaskQueue (high-priority, drains completely), MacrotaskQueue (lower-priority), and TimerRegistry (virtual timer tracking for setTimeout/setInterval).

## Requirements

### Requirement: MicrotaskQueue FIFO Ordering

The MicrotaskQueue MUST process callbacks in First-In-First-Out order.

#### Scenario: Basic FIFO behavior

- GIVEN an empty MicrotaskQueue
- WHEN callback A is enqueued, then callback B is enqueued
- WHEN dequeue() is called twice
- THEN the first dequeue returns A, the second returns B

#### Scenario: Peek without removal

- GIVEN a MicrotaskQueue with one callback
- WHEN peek() is called
- THEN returns the callback without removing it
- AND subsequent peek() returns the same callback

### Requirement: MicrotaskQueue Drain-All Behavior

The MicrotaskQueue MUST drain completely before returning, processing any callbacks added during execution.

#### Scenario: Drain all pending microtasks

- GIVEN a MicrotaskQueue with three callbacks queued
- WHEN drain() is called
- THEN all three callbacks are dequeued and returned
- AND queue is empty afterward

#### Scenario: Nested microtasks execute in order

- GIVEN callback A is enqueued that schedules callback B via queueMicrotask
- WHEN drain() is called
- THEN callback A executes first
- AND callback B (scheduled during A) is also executed
- AND B executes before any subsequent macrotask

### Requirement: MicrotaskQueue Error Handling

The MicrotaskQueue MUST throw appropriate errors for invalid operations.

#### Scenario: Dequeue from empty queue

- GIVEN an empty MicrotaskQueue
- WHEN dequeue() is called
- THEN throws QueueUnderflowError

#### Scenario: Peek from empty queue

- GIVEN an empty MicrotaskQueue
- WHEN peek() is called
- THEN throws QueueUnderflowError

### Requirement: MacrotaskQueue FIFO Ordering

The MacrotaskQueue MUST process callbacks in First-In-First-Out order, same as MicrotaskQueue.

#### Scenario: Basic FIFO behavior

- GIVEN an empty MacrotaskQueue
- WHEN callback X is enqueued, then callback Y is enqueued
- WHEN dequeue() is called twice
- THEN the first dequeue returns X, the second returns Y

### Requirement: TimerRegistry Virtual Time

The TimerRegistry MUST track timers using virtual time, not real system time.

#### Scenario: Timer fires after delay

- GIVEN TimerRegistry at virtual time 0
- WHEN register(callback, 100, false) is called
- AND advance(50) is called
- THEN due() returns empty (timer not yet due)
- AND advance(60) is called
- THEN due() returns the callback (110 total elapsed ≥ 100 delay)

#### Scenario: Multiple timers with different delays

- GIVEN TimerRegistry at virtual time 0
- WHEN register(callbackA, 50, false) is called
- AND register(callbackB, 100, false) is called
- AND advance(75) is called
- THEN due() returns only callbackA
- AND callbackB remains pending

### Requirement: TimerRegistry setInterval Handling

The TimerRegistry MUST re-register interval timers after their callback executes.

#### Scenario: setInterval repeats

- GIVEN TimerRegistry at virtual time 0
- WHEN register(intervalCallback, 30, true) is called
- AND advance(35) is called (callback fires)
- THEN due() returns the callback
- AND after clearing due timers, another advance(30) fires callback again