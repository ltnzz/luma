import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[API] Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`[API] Health check available at http://localhost:${env.PORT}/health`);
});

export default server;
