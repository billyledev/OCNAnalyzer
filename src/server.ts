import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import HapiPino from 'hapi-pino';

import ocnPlugin from '@/plugins/ocnPlugin';

const isProduction = process.env.NODE_ENV === 'production';
const BASE_URL = process.env.BASE_URL ?? '';

const SSL_ENABLED = process.env.SSL_ENABLED === 'true';
const SSL_KEY_PATH = path.join(__dirname, 'certificates', 'key.pem');
const SSL_CSR_PATH = path.join(__dirname, 'certificates', 'csr.pem');
const SSL_CERT_PATH = path.join(__dirname, 'certificates', 'cert.pem');

if (SSL_ENABLED && (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH))) {
  childProcess.execSync(`openssl genrsa -out ${SSL_KEY_PATH}`);
  childProcess.execSync(`openssl req -new -key ${SSL_KEY_PATH} -out ${SSL_CSR_PATH} \
-subj "/C=FR/ST=Alpes-Maritimes/L=Valbonne/O=OCN Analyzer/OU=/CN=localhost"`);
  childProcess.execSync(`openssl x509 -req -days 365 -in ${SSL_CSR_PATH} \
-signkey ${SSL_KEY_PATH} -out ${SSL_CERT_PATH}`);
}

const tls = SSL_ENABLED ? {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH),
} : undefined;

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT ?? 3000,
  host: process.env.HOST ?? '0.0.0.0',
  tls,
  routes: {
    cors: {
      origin: [BASE_URL],
    },
    validate: {
      failAction: async (request, h, err) => {
        if (isProduction) {
          console.error('ValidationError:', err?.message);
          throw Boom.badRequest('Invalid input');
        } else {
          console.log(err);
          throw err ?? new Error('Unknown error');
        }
      },
    },
  },
});

export async function createServer(): Promise<Hapi.Server> {
  await server.register({
    plugin: HapiPino,
    options: {
      logEvents: process.env.TEST === 'true' ? false : undefined,
      redact: ['req.headers.authorization'],
      ...(isProduction ? {} : { transport: { target: 'pino-pretty' } }),
    },
  });

  await server.register(ocnPlugin);
  await server.initialize();

  return server;
}

export async function startServer(s: Hapi.Server): Promise<Hapi.Server> {
  await s.start();
  s.log('info', `Server running on ${s.info.uri}`);
  return s;
}

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});
