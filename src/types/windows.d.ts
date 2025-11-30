interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
    isRabby?: boolean;
    isBraveWallet?: boolean;
    on?: (event: string, handler: (...args: any[]) => void) => void;
    removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  };

  storage?: {
    get: (key: string, shared?: boolean) => Promise<{ key: string; value: string; shared: boolean } | null>;
    set: (key: string, value: string, shared?: boolean) => Promise<{ key: string; value: string; shared: boolean } | null>;
    delete: (key: string, shared?: boolean) => Promise<{ key: string; deleted: boolean; shared: boolean } | null>;
    list: (prefix?: string, shared?: boolean) => Promise<{ keys: string[]; prefix?: string; shared: boolean } | null>;
  };

  fs?: {
    readFile: (path: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
  };
}

export {};