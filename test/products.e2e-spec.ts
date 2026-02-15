import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let categoryId: string;
  let productId: string;

  const testAdmin = {
    email: 'adminproduct@example.com',
    password: 'Password@123',
  };

  const testCategory = {
    name: 'Test Category',
    description: 'Test category for products',
    slug: 'test-category',
  };

  const testProduct = {
    name: 'Test Product',
    description: 'Test product description',
    price: 99.99,
    stock: 100,
    sku: 'TEST-SKU-001',
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

    // Clean up test data
    await prisma.product.deleteMany({ where: { sku: testProduct.sku } });
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testAdmin.email } });

    // Create admin user via register then upgrade to admin
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testAdmin);

    adminToken = registerResponse.body.accessToken;
    
    // Update user to admin role
    await prisma.user.update({
      where: { email: testAdmin.email },
      data: { role: 'ADMIN' },
    });

    // Create category for products
    const category = await prisma.category.create({
      data: testCategory,
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { sku: testProduct.sku } });
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testAdmin.email } });
    await app.close();
  });

  describe('/api/v1/products (POST)', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...testProduct, categoryId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(testProduct.name);
          expect(res.body.sku).toBe(testProduct.sku);
          productId = res.body.id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ ...testProduct, sku: 'ANOTHER-SKU', categoryId })
        .expect(401);
    });
  });

  describe('/api/v1/products (GET)', () => {
    it('should get all products', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body).toHaveProperty('meta');
        });
    });
  });

  describe('/api/v1/products/:id (GET)', () => {
    it('should get product by id', async () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/${productId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(productId);
          expect(res.body.name).toBe(testProduct.name);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

describe('/api/v1/products/:id (PATCH)', () => {
    it('should update product', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 149.99, stock: 50 })
        .expect(200)
        .expect((res) => {
          expect(Number(res.body.price)).toBe(149.99);
          expect(res.body.stock).toBe(50);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/products/${productId}`)
        .send({ price: 199.99 })
        .expect(401);
    });
  });

  describe('/api/v1/products/:id (DELETE)', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .expect(401);
    });

    it('should delete product', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });
  });
});
