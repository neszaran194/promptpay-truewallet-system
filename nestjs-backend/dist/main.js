"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
    }));
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
//# sourceMappingURL=main.js.map