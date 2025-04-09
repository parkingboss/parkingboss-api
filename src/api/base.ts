export interface BaseWatcher {
  subscribe(fn: (href: string) => void): () => void;
  get(): string;
  set(val: string): void;
  update(fn: (href: string) => string): void;
}

export function apiBase(): BaseWatcher {
  const link = new URL("https://api.propertyboss.io/v2");

  return {
    subscribe(fn) {
      fn(link.href);

      return () => {};
    },

    set(val) {
      link.href = val;
    },

    get() {
      return link.href;
    },

    update(fn) {
      link.href = fn(link.href);
    },
  };
}
