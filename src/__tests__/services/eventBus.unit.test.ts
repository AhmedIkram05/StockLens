/**
 * eventBus Unit Tests
 * 
 * Purpose: Validates the global event bus used for cross-component
 * communication without tight coupling.
 * 
 * What it tests:
 * - Subscribe/emit pattern for event-driven updates
 * - Multiple listeners on the same event
 * - Unsubscribe functionality and cleanup
 * - Error isolation (one failing listener doesn't break others)
 * - Payload delivery to all subscribers
 * 
 * Why it's important: The event bus enables loose coupling between
 * components (e.g., receipt deletion triggers list refresh on another
 * screen). Tests ensure subscriptions work correctly, unsubscribe
 * prevents memory leaks, and errors in one listener don't cascade.
 */

import { subscribe, emit } from '@/services/eventBus';

describe('eventBus', () => {
  beforeEach(() => {
    // Clear all listeners between tests by accessing internal state
    const listeners = (subscribe as any).listeners || {};
    Object.keys(listeners).forEach(key => delete listeners[key]);
  });

  it('subscribes to events and receives payloads', () => {
    const listener = jest.fn();

    subscribe('test-event', listener);
    emit('test-event', { data: 'hello' });

    expect(listener).toHaveBeenCalledWith({ data: 'hello' });
  });

  it('supports multiple listeners for same event', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    subscribe('multi-event', listener1);
    subscribe('multi-event', listener2);

    emit('multi-event', { count: 42 });

    expect(listener1).toHaveBeenCalledWith({ count: 42 });
    expect(listener2).toHaveBeenCalledWith({ count: 42 });
  });

  it('unsubscribes listeners correctly', () => {
    const listener = jest.fn();

    const unsubscribe = subscribe('unsub-event', listener);
    emit('unsub-event', { test: 1 });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    emit('unsub-event', { test: 2 });

    expect(listener).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('isolates errors in individual listeners', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const goodListener = jest.fn();
    const badListener = jest.fn(() => {
      throw new Error('Listener crashed');
    });

    subscribe('error-test', badListener);
    subscribe('error-test', goodListener);

    emit('error-test', { data: 'payload' });

    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
