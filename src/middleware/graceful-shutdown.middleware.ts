import { Request, Response, NextFunction } from 'express';

let isShuttingDown = false;

export function gracefulShutdownMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (isShuttingDown) {
    return res.status(503).send('🛑 Server shutting down');
  }

  if (req.destroyed || req.socket.destroyed) {
    return res.status(408).send('❌ Client closed request');
  }

  next();
}

export function setShuttingDown(value: boolean) {
  isShuttingDown = value;
}
