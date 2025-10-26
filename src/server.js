import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import contactsRouter from './routers/contacts.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import router from './routers/index.js';
import cookieParser from 'cookie-parser';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';

const PORT = Number(process.env.PORT) || 3000;

export function setupServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use(cors());

  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  app.use(
    pinoHttp({
      logger,

      customSuccessMessage: function () {
        return 'request completed';
      },
    }),
  );

  const swaggerDocument = YAML.load('./docs/openapi.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use(router);
  app.use(contactsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Swagger Docs available at: http://localhost:${PORT}/api-docs`);
  });

  return app;
}
