import type Hapi from '@hapi/hapi';
import type Boom from '@hapi/boom';

export {};

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;

    HOST: string;
    PORT: string;

    BASE_URL: string;

    SSL_ENABLED: string;
  }
}

declare global {
  type APIResponse = Hapi.ResponseObject | Boom.Boom;
}
