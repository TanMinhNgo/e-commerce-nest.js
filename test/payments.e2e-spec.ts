import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let categoryId: string;
  let productId: string;
  let orderId: string;
  let paymentId: string;

  const testUser = {
    email: 'paymenttest@example.com',
    password: 'Password@123',
  };

  const testCategory = {
    name: 'Payment Test Category',
    description: 'Test category',
    slug: 'payment-test-category',
  };

  const testProduct = {
    name: 'Payment Test Product',
    description: 'Test product',
    price: 199.99,
    stock: 100,
    sku: 'PAYMENT-TEST-001',
    isActive: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    app.setGlobalPrefix('/api/v1');

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up
    await prisma.product.deleteMany({ where: { sku: testProduct.sku } });
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    // Create test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.accessToken;

    // Create category
    const category = await prisma.category.create({
      data: testCategory,
    });
    categoryId = category.id;

    // Create product
    const product = await prisma.product.create({
      data: { ...testProduct, categoryId },
    });
    productId = product.id;

    // Create an order
    const orderResponse = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [
          {
            productId,
            quantity: 1,
            price: testProduct.price,
          },
        ],
        shippingAddress: {
          street: '123 Payment Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
        },
      });

    orderId = orderResponse.body.data.id;
  });

  afterAll(async () => {
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({ where: { sku: testProduct.sku } });
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('/api/v1/payments/create-intent (POST)', () => {
    it('should create payment intent', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('clientSecret');
          expect(res.body.data).toHaveProperty('paymentIntentId');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .send({ orderId })
        .expect(401);
    });

    it('should fail with invalid order id', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });
  });

  describe('/api/v1/payments/confirm (POST)', () => {
    let paymentIntentId: string;

    beforeAll(async () => {
      // Create a payment intent first
      const intentResponse = await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ orderId });

      paymentIntentId = intentResponse.body.data.paymentIntentId;
    });

    it('should confirm payment', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          paymentIntentId,
          paymentMethodId: 'pm_card_visa', // Test Stripe payment method
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.status).toBeDefined();
          paymentId = res.body.data.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/confirm')
        .send({
          paymentIntentId,
          paymentMethodId: 'pm_card_visa',
        })
        .expect(401);
    });
  });

  describe('/api/v1/payments/:id (GET)', () => {
    it('should get payment by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(paymentId);
          expect(res.body.data).toHaveProperty('amount');
          expect(res.body.data).toHaveProperty('status');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .expect(401);
    });

    it('should return 404 for non-existent payment', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/api/v1/payments/order/:orderId (GET)', () => {
    it('should get payments by order id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/payments/order/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/payments/order/${orderId}`)
        .expect(401);
    });
  });

  describe('/api/v1/payments (GET)', () => {
    it('should get all user payments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toBeDefined();
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/payments')
        .expect(401);
    });
  });
});
