# Payments MS - TP4

Microservicio HTTP con NestJS que crea Checkout Sessions en Stripe y recibe el webhook `charge.succeeded`.

## Stack
NestJS 12 + `stripe` + `@nestjs/config` + `class-validator` / `class-transformer`

## Variables de entorno

Copiar `.env.template` -> `.env` (`.env` no se versiona):

```
PORT=3003
STRIPE_SECRET=sk_test_...
STRIPE_SUCCESS_URL=http://localhost:3003/payments/success
STRIPE_CANCEL_URL=http://localhost:3003/payments/cancel
STRIPE_ENDPOINT_SECRET=whsec_...
```

`STRIPE_ENDPOINT_SECRET` se obtiene de `stripe listen --forward-to localhost:3003/payments/webhook`.

## Instalación y ejecución

```bash
npm install
npm run start:dev   # http://localhost:3003
npm run build && npm run start:prod
```

## API

### POST /payments/create-payment-session
```json
{
  "orderId": "ord-1",
  "currency": "usd",
  "items": [{ "name": "Producto", "price": 20, "quantity": 1 }]
}
```
- `price` se envía a Stripe como `Math.round(price*100)` (centavos).
- `orderId` viaja en `payment_intent_data.metadata`.
- Responde `{ id, url }` de la Checkout Session.

Validaciones (`ValidationPipe` global `whitelist` + `forbidNonWhitelisted`): `orderId` y `currency` obligatorios, `items` min 1, `items[].name` string, `price`/`quantity` positivos, campos extra => 400.

### GET /payments/success
`{ "ok": true, "message": "Payment successful" }`

### GET /payments/cancel
`{ "ok": false, "message": "Payment cancelled" }`

URLs de success/cancel salen de env, no del body.

### POST /payments/webhook
- Header `stripe-signature` obligatorio.
- Cuerpo crudo (`NestFactory.create(AppModule, { rawBody: true })` + `req['rawBody']`).
- Verifica con `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_ENDPOINT_SECRET)`.
- Firma inválida => `400`.
- `charge.succeeded` => loguea `metadata.orderId` y retorna `200 { received: true }`.
- Otros `event.type` => log "Unhandled" y `200` para no reintentar.

## Probar en local

```bash
# terminal 1: MS
npm run start:dev

# terminal 2: reenvío de webhooks
stripe login
stripe listen --forward-to localhost:3003/payments/webhook
# copiar whsec_... a STRIPE_ENDPOINT_SECRET y reiniciar el MS

# crear sesión
curl -X POST http://localhost:3003/payments/create-payment-session \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ord-1","currency":"usd","items":[{"name":"Producto","price":20,"quantity":1}]}'

# abrir la `url` devuelta y pagar con 4242 4242 4242 4242
# o disparar evento de prueba:
stripe trigger charge.succeeded
```

## Criterios de aceptación cubiertos
- Request válido crea sesión y devuelve `url`.
- Request inválido (sin items, precio negativo, campos extra) => `400`.
- `orderId` en `payment_intent_data.metadata`.
- Webhook sin firma válida => no se procesa / `400`.
- `charge.succeeded` loguea `orderId` y responde `200`.
