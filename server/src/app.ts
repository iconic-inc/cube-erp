import morgan from 'morgan';
import helmet from 'helmet';
import express from 'express';
import compression from 'compression';
import 'express-async-errors';
import { v4 as uuid } from 'uuid';
import path from 'path';
import cors from 'cors';

import '@utils/interface';
import { logger } from '@loggers/logger.log';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';

require('dotenv').config();
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      },
    },
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || process.env.ALLOWED_ORIGINS?.split(',').includes(origin)) {
        callback(null, true);
      } else callback(new Error('Not allowed by CORS'));
    },
    // origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-client-id',
      'x-refresh-token',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// log requests
if (['development', 'test'].includes(process.env.NODE_ENV as string)) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || uuid();
  req.requestId = requestId;

  res.setHeader('x-request-id', requestId);

  logger.info('Incoming request', {
    context: req.path,
    requestId,
    metadata: req.method === 'GET' ? req.query : req.body,
  });

  next();
});

// Serve static files with CORS
const UPLOADS_DIR = ['production'].includes(process.env.NODE_ENV as string)
  ? path.join(__dirname, '../../public/uploads') // production code place inside dist folder
  : path.join(__dirname, '../public/uploads');
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    setHeaders: (res, path) => {
      // res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  })
);

// Serve static files with CORS
const EXPORTS_DIR = ['production'].includes(process.env.NODE_ENV as string)
  ? path.join(__dirname, '../../public/exports') // production code place inside dist folder
  : path.join(__dirname, '../public/exports');
app.use(
  '/exports',
  express.static(EXPORTS_DIR, {
    setHeaders: (res, path) => {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  })
);

// init routers
app.use(express.Router().use('/api/v1', require('./api/routers')));

// Format not found requests response
app.use('*', notFoundHandler);
app.use(errorHandler);

export { app };
