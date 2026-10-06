import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { DEFAULT_API_PORT, DEFAULT_FRONTEND_URL } from "./config/index.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl =
    configService.get<string>("FRONTEND_URL") ?? DEFAULT_FRONTEND_URL;
  const port = Number(configService.get<string>("PORT") ?? DEFAULT_API_PORT);

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(port);
}

void bootstrap();
