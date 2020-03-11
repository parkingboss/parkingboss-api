const BASE_LINK_QUERY = "link[rel~='index'][rel~='api'][type~='application/json']";

function apiBaseLink(): HTMLLinkElement {
  const link: null | HTMLLinkElement = document.querySelector(BASE_LINK_QUERY);

  if (!link) {
    throw new Error(`No <${BASE_LINK_QUERY}> found!`);
  }

 return link;
}

export interface BaseWatcher {
  subscribe(fn: (href: string) => void): () => void;
  get(): string;
  set(val: string): void;
  update(fn: (href: string) => string): void;
}

export function apiBase(): BaseWatcher {
  const link = apiBaseLink();

  return {
    subscribe(fn) {
      fn(link.href);

      const observer = new MutationObserver(muts => {
        muts.forEach(mut => {
          if (mut.attributeName === 'href') fn(link.href);
        })
      });
      observer.observe(link, { attributes: true });

      return () => observer.disconnect();
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
