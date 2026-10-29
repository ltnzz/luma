import app from './app';
import { env } from './config/env';
import { pool } from './db';

let server: ReturnType<typeof app.listen> | undefined;

// Only bind HTTP listener when NOT running in a serverless environment (e.g. Vercel)
if (!process.env.VERCEL) {
  server = app.listen(env.PORT, () => {
    console.log(`[API] Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`[API] Health check available at http://localhost:${env.PORT}/health`);
  });

  const handleGracefulShutdown = (signal: string): void => {
    console.log(`\n[API] Received ${signal}. Shutting down gracefully...`);
    server?.close(async () => {
      console.log('[API] HTTP server closed.');
      try {
        await pool.end();
        console.log('[API] Database connection pool closed.');
        process.exit(0);
      } catch (err) {
        console.error('[API] Error during pool termination:', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('[API] Force shutdown timeout exceeded. Exiting...');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

export { app, server };
export default app;
