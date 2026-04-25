import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });

  const enableSwagger = process.env.SWAGGER !== '0';
  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Webinar API')
      .setDescription(
        'REST API for the demo app. Call **POST /api/login** (or **/api/register**) first; the session cookie is used for protected routes. Open this UI from the same host as the API (e.g. `http://localhost:3001`) so Try it out sends the `token` cookie.',
      )
      .setVersion('1.0')
      .addApiKey({ type: 'apiKey', in: 'cookie', name: 'token' }, 'access-token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API NestJS corriendo en http://localhost:${port}`);
  if (enableSwagger) {
    const base = `http://localhost:${port}`;
    console.log(`Swagger UI: ${base}/api/docs`);
  }
}
bootstrap();
