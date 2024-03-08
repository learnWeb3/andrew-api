import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrivateAppModule } from './private-app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    '/swagger/*',
    basicAuth({
      challenge: true,
      users: {
        'andrew-admin':
          process.env.NODE_ENV === 'production'
            ? process.env.BASIC_AUTH_PASSWORD
            : '123',
      },
    }),
  );

  const publicAppConfig = new DocumentBuilder()
    .setTitle('Andrew API')
    .setDescription('The Andrew Insurance product main PUBLIC API.')
    .setVersion('1.0')
    .build();

  const publicDocument = SwaggerModule.createDocument(app, publicAppConfig);

  SwaggerModule.setup('swagger/public', app, publicDocument);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  await app.listen(3000);

  const privateApp =
    await NestFactory.create<NestExpressApplication>(PrivateAppModule);

  const privateAppConfig = new DocumentBuilder()
    .setTitle('Andrew API')
    .setDescription('The Andrew Insurance product main PRIVATE API.')
    .setVersion('1.0')
    .build();

  const privateDocument = SwaggerModule.createDocument(
    privateApp,
    privateAppConfig,
  );
  SwaggerModule.setup('swagger/private', privateApp, privateDocument);

  privateApp.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  await privateApp.listen(3001);
}
bootstrap();
