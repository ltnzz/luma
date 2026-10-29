import { Request, Response, NextFunction } from 'express';

export function cacheControl(maxAgeSeconds = 300, staleWhileRevalidate = 600) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setHeader(
      'Cache-Control',
      `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidate}`
    );
    next();
  };
}

