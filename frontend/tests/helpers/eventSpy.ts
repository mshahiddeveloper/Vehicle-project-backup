export interface CapturedEvent<T = any> {
  type: string;
  detail: T;
  timestamp: number;
}

export interface EventSpy {
  readonly events: CapturedEvent[];
  readonly count: number;
  first: () => CapturedEvent | undefined;
  last: () => CapturedEvent | undefined;
  findByType: (type: string) => CapturedEvent[];
  clear: () => void;
  teardown: () => void;
}

export function createEventSpy(eventNames: string | string[]): EventSpy {
  const captured: CapturedEvent[] = [];
  const names = Array.isArray(eventNames) ? eventNames : [eventNames];

  const handler = (e: Event) => {
    const custom = e as CustomEvent;
    captured.push({
      type: e.type,
      detail: custom?.detail,
      timestamp: Date.now(),
    });
  };

  names.forEach((name) => window.addEventListener(name, handler));

  return {
    get events() {
      return [...captured];
    },
    get count() {
      return captured.length;
    },
    first: () => captured[0],
    last: () => captured[captured.length - 1],
    findByType: (type: string) => captured.filter((c) => c.type === type),
    clear: () => {
      captured.length = 0;
    },
    teardown: () => {
      names.forEach((name) => window.removeEventListener(name, handler));
    },
  };
}
