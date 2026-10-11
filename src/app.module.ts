import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from './authentication/authentication.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { jwtModuleOptions } from './common/jwt-options';
import { readConfig } from './common/env';
import { AssetUrlInterceptor } from './common/asset-url.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: jwtModuleOptions,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = readConfig(configService, 'MONGO_URI', 'MONGODB_URI');
        if (!uri) {
          throw new Error('MONGO_URI is required');
        }
        return { uri };
      },
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const user = readConfig(
          configService,
          'SMTP_USER',
          'APP_EMAIL',
          'MAIL_USER',
        );
        const pass = readConfig(
          configService,
          'SMTP_PASS',
          'APP_EMAIL_PASS',
          'MAIL_PASS',
        );
        const fromName = readConfig(
          configService,
          'SMTP_FROM',
          'APP_EMAIL_USERNAME',
        );
        const allowInvalidCerts =
          configService.get<string>('SMTP_ALLOW_INVALID_CERTS') === 'true';

        return {
          transport: {
            host: readConfig(configService, 'SMTP_HOST', 'MAIL_HOST'),
            port: Number(
              readConfig(configService, 'SMTP_PORT', 'MAIL_PORT') || 587,
            ),
            secure:
              readConfig(configService, 'SMTP_PORT', 'MAIL_PORT') === '465',
            auth: {
              user,
              pass,
            },
            ...(allowInvalidCerts
              ? { tls: { rejectUnauthorized: false } }
              : {}),
          },
          defaults: {
            from: `"${fromName || 'Wellness Warriors'}" <${user}>`,
          },
        };
      },
    }),
    UserModule,
    EventModule,
    AuthenticationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AssetUrlInterceptor,
    },
  ],
})
export class AppModule {}
