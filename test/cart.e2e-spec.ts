import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let categoryId: string;
  let productId: string;
  let cartItemId: string;

  const testUser = {
    email: 'carttest@example.com',
    password: 'Password@123',
  };

  const testCategory = {
    name: 'Cart Test Category',
    description: 'Test category',
    slug: 'cart-test-category',
  };

  const testProduct = {
    name: 'Cart Test Product',
    description: 'Test product',
    price: 49.99,
    stock: 100,
    sku: 'CART-TEST-001',
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
    await prisma.cartItem.deleteMany({});
    await prisma.product.deleteMany({ where: { sku: testProduct.sku } });
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('/api/v1/cart/items (POST)', () => {
    it('should add item to cart', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId, quantity: 2 })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data.items.length).toBeGreaterThan(0);
          cartItemId = res.body.data.items[0].id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .send({ productId, quantity: 1 })
        .expect(401);
    });

    it('should fail with invalid quantity', () => {
      return request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId, quantity: 0 })
        .expect(400);
    });
  });

  describe('/api/v1/cart (GET)', () => {
    it('should get user cart', () => {
      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/cart')
        .expect(401);
    });
  });

  describe('/api/v1/cart/items/:id (PATCH)', () => {
    it('should update cart item quantity', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('items');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/cart/items/${cartItemId}`)
        .send({ quantity: 3 })
        .expect(401);
    });
  });

  describe('/api/v1/cart/items/:id (DELETE)', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .expect(401);
    });

    it('should remove item from cart', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('/api/v1/cart (DELETE)', () => {
    it('should clear cart', async () => {
      // Add item first
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ productId, quantity: 1 });

      return request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/cart')
        .expect(401);
    });
  });
});
