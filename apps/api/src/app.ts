import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  // Trust first proxy hop (reverse proxy / load balancer on cloud platforms)
  app.set('trust proxy', 1);

  // Security & Optimization Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        // Requests without Origin include health probes and server-to-server calls.
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = origin.replace(/\/$/, '');
        if (env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes(normalizedOrigin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin '${origin}' is not allowed by CORS`));
      },
      methods: ['GET', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Accept', 'Content-Type'],
    })
  );
  app.use(compression());
  app.use(globalRateLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Routes
  app.use(routes);

  // 404 & Centralized Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
