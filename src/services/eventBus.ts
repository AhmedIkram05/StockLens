type Listener = (payload?: any) => void;

const listeners: Record<string, Set<Listener>> = {};

export const subscribe = (event: string, fn: Listener) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(fn);
  return () => {
    listeners[event].delete(fn);
    if (listeners[event].size === 0) delete listeners[event];
  };
};

export const emit = (event: string, payload?: any) => {
  const set = listeners[event];
  if (!set) return;
  for (const fn of Array.from(set)) {
    try {
      fn(payload);
    } catch (e) {
      // swallow individual listener errors
      console.error('eventBus listener error', e);
    }
  }
};

export default { subscribe, emit };
