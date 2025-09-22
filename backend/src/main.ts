import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4000',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:4000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // Set global prefix
  app.setGlobalPrefix('');

  const port = process.env.PORT || 3001;

  await app.listen(port);

  console.log('🚀 PromptPay & TrueWallet Backend Server is running!');
  console.log(`📡 Server listening on port ${port}`);
  console.log(`🌐 API Base URL: http://localhost:${port}/api`);
  console.log('✅ CORS enabled for frontend applications');
  console.log('📝 Global validation enabled');
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
