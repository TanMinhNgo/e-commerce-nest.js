import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let categoryId: string;
  let productId: string;
  let orderId: string;

  const testUser = {
    email: 'ordertest@example.com',
    password: 'Password@123',
  };

  const testCategory = {
    name: 'Order Test Category',
    description: 'Test category',
    slug: 'order-test-category',
  };

  const testProduct = {
    name: 'Order Test Product',
    description: 'Test product',
    price: 79.99,
    stock: 100,
    sku: 'ORDER-TEST-001',
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
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({ where: { sku: testProduct.sku } });
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('/api/v1/orders (POST)', () => {
    it('should create a new order', () => {
      const orderData = {
        items: [
          {
            productId,
            quantity: 2,
            price: testProduct.price,
          },
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
        },
      };

      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orderData)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.status).toBe('PENDING');
          expect(res.body.data.total).toBeGreaterThan(0);
          orderId = res.body.data.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          items: [{ productId, quantity: 1, price: testProduct.price }],
          shippingAddress: { street: 'Test', city: 'Test', state: 'TS', zipCode: '12345', country: 'Test' },
        })
        .expect(401);
    });
  });

  describe('/api/v1/orders (GET)', () => {
    it('should get user orders', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(401);
    });
  });

  describe('/api/v1/orders/:id (GET)', () => {
    it('should get order by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(orderId);
          expect(res.body.data).toHaveProperty('items');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .expect(401);
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/api/v1/orders/:id (PATCH)', () => {
    it('should update order', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'PROCESSING' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('PROCESSING');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}`)
        .send({ status: 'SHIPPED' })
        .expect(401);
    });
  });

  describe('/api/v1/orders/:id (DELETE)', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/orders/${orderId}`)
        .expect(401);
    });
  });
});
