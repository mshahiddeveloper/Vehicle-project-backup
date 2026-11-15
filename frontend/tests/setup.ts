import { beforeEach, vi } from 'vitest';

// 1. In-memory LocalStorage simulation implementing Web Storage API
class LocalStorageMock implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

const localStorageInstance = new LocalStorageMock();
const sessionStorageInstance = new LocalStorageMock();
let eventTarget = new EventTarget();

// 2. Mock browser window & navigation globals
const mockWindow: any = {
  get localStorage() {
    return localStorageInstance;
  },
  get sessionStorage() {
    return sessionStorageInstance;
  },
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    eventTarget.addEventListener(type, listener, options);
  },
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => {
    eventTarget.removeEventListener(type, listener, options);
  },
  dispatchEvent: (event: Event): boolean => {
    return eventTarget.dispatchEvent(event);
  },
  CustomEvent: globalThis.CustomEvent,
  Event: globalThis.Event,
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SafarPK-TestRunner',
  },
  alert: vi.fn(),
  confirm: vi.fn(() => true),
  prompt: vi.fn(() => null),
};

// 3. Mock document for export links (CSV / file downloads)
const mockDocument: any = {
  createElement: (tag: string) => {
    const element: any = {
      tagName: tag.toUpperCase(),
      attributes: {},
      setAttribute: (k: string, v: string) => {
        element.attributes[k] = v;
      },
      getAttribute: (k: string) => element.attributes[k] ?? null,
      click: vi.fn(),
      style: {},
    };
    return element;
  },
  body: {
    appendChild: (node: any) => node,
    removeChild: (node: any) => node,
  },
};

// 4. Attach globals
Object.defineProperty(globalThis, 'window', {
  value: mockWindow,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageInstance,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageInstance,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: mockDocument,
  writable: true,
  configurable: true,
});

// 5. Reset storage and eventTarget before each test to eliminate cross-test state leakage
beforeEach(() => {
  localStorageInstance.clear();
  sessionStorageInstance.clear();
  eventTarget = new EventTarget();
});
