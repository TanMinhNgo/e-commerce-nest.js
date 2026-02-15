import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.setGlobalPrefix('/api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API for an e-commerce application')
    .addServer(
      `http://localhost:${process.env.PORT}`,
      'Local development server',
    )
    .setVersion('1.0')
    .addTag(
      'Authentication',
      'Endpoints related to user authentication and authorization',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'jwt-auth',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Refresh-JWT',
        description: 'Enter JWT refresh token',
        in: 'header',
      },
      'jwt-refresh',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'E-commerce API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { background-color: #4a90e2; }
      .swagger-ui .topbar a { color: #fff; font-weight: bold; }
      .swagger-ui .info { border-bottom: 2px solid #4a90e2; }
      .swagger-ui .opblock.opblock-post { border-left: 5px solid #4a90e2; }
      .swagger-ui .opblock.opblock-get { border-left: 5px solid #50e3c2; }
      .swagger-ui .opblock.opblock-put { border-left: 5px solid #f5a623; }
      .swagger-ui .opblock.opblock-delete { border-left: 5px solid #d0021b; }
    `,
  });

  await app.listen(process.env.PORT!).then(() => {
    console.log(
      `Server is running on http://localhost:${process.env.PORT}/api/v1/docs`,
    );
  });
}
bootstrap().catch((err) => {
  console.error('Error during server bootstrap:', err);
  process.exit(1);
});
