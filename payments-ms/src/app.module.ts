import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        const required = [
          'PORT',
          'STRIPE_SECRET',
          'STRIPE_SUCCESS_URL',
          'STRIPE_CANCEL_URL',
          'STRIPE_ENDPOINT_SECRET',
        ];
        const missing = required.filter((key) => !config[key]);
        if (missing.length > 0) {
          throw new Error(
            `Missing required env variables: ${missing.join(', ')}`,
          );
        }
        return config;
      },
    }),
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
