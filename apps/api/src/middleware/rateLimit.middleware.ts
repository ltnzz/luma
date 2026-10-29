import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per 15 minutes
  standardHeaders: true, // Return standard rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => req.path === '/health', // Exclude health check from rate limiting
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later.',
  },
});

