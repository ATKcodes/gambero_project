declare module 'bonjour' {
  interface Service {
    name: string;
    type: string;
    host: string;
    port: number;
    fqdn: string;
    txt: Record<string, any>;
    published: boolean;
    addresses: string[];
  }

  interface PublishOptions {
    name: string;
    host?: string;
    port: number;
    type: string;
    subtypes?: string[];
    protocol?: string;
    txt?: Record<string, any>;
  }

  interface Browser {
    start(): void;
    stop(): void;
    update(): void;
    on(event: 'up' | 'down', listener: (service: Service) => void): this;
    services: Service[];
  }

  interface Bonjour {
    publish(options: PublishOptions): Service;
    unpublishAll(callback?: () => void): void;
    find(options: { type: string }, onUp?: (service: Service) => void): Browser;
    findOne(options: { type: string }, callback?: (service: Service) => void): Browser;
    destroy(): void;
  }

  function bonjour(opts?: any): Bonjour;
  
  export = bonjour;
}
