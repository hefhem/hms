import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const logger = new Logger('HMS-Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Security Architecture Hardening (VAPT Compliance)
  app.use(helmet());
  app.use(compression());

  // 2. CORS Policy
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Global API Route Prefix
  app.setGlobalPrefix('api');

  // 4. Strict Validation Pipe (Prevents Mass Assignment Attacks)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 5. Swagger API Documentation (VAPT / Endpoint Inspection)
  const config = new DocumentBuilder()
    .setTitle('Enterprise HMS / CMS REST API')
    .setDescription('Hospital Management System API with EMR, Pharmacy, Billing, MFA & Concurrency Control')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`===========================================================`);
  logger.log(`🚀 HMS Backend API running at http://localhost:${port}/api`);
  logger.log(`📚 Swagger API Docs available at http://localhost:${port}/api/docs`);
  logger.log(`===========================================================`);
}
bootstrap();
