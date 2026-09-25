import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto.js';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly configService: ConfigService) {
    const stripeSecret = this.configService.get<string>('STRIPE_SECRET');
    if (!stripeSecret) {
      throw new Error('STRIPE_SECRET is not defined');
    }
    this.stripe = new Stripe(stripeSecret);
  }

  async createPaymentSession(dto: CreatePaymentSessionDto) {
    const successUrl = this.configService.get<string>('STRIPE_SUCCESS_URL')!;
    const cancelUrl = this.configService.get<string>('STRIPE_CANCEL_URL')!;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      dto.items.map((item) => ({
        price_data: {
          currency: dto.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        metadata: {
          orderId: dto.orderId,
        },
      },
    });

    return {
      id: session.id,
      url: session.url,
    };
  }

  handleWebhook(rawBody: Buffer, signature: string) {
    const endpointSecret = this.configService.get<string>(
      'STRIPE_ENDPOINT_SECRET',
    )!;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      this.logger.warn(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException(`Webhook Error: ${message}`);
    }

    switch (event.type) {
      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge;
        const orderId = (charge.metadata as Record<string, string> | null)
          ?.orderId;
        this.logger.log(
          `charge.succeeded - orderId: ${orderId ?? 'N/A'} | chargeId: ${charge.id}`,
        );
        if (orderId) {
          this.logger.log(`Payment confirmed for orderId: ${orderId}`);
        }
        break;
      }
      default: {
        this.logger.log(`Unhandled event type: ${event.type}`);
        break;
      }
    }

    return { received: true };
  }
}
