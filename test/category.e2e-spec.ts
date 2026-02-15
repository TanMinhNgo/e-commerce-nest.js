import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Category (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let categoryId: string;

  const testUser = {
    email: 'categorytest@example.com',
    password: 'Password@123',
  };

  const testCategory = {
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    slug: 'electronics-test',
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
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });

    // Create test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.accessToken;
  });

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { slug: testCategory.slug } });
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('/api/v1/categories (POST)', () => {
    it('should create a new category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCategory)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe(testCategory.name);
          expect(res.body.data.slug).toBe(testCategory.slug);
          categoryId = res.body.data.id;
        });
    });

    it('should fail with duplicate slug', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testCategory)
        .expect(409);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ ...testCategory, slug: 'another-slug' })
        .expect(401);
    });
  });

  describe('/api/v1/categories (GET)', () => {
    it('should get all categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter active categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories?isActive=true')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/v1/categories/:id (GET)', () => {
    it('should get category by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(categoryId);
          expect(res.body.data.name).toBe(testCategory.name);
        });
    });

    it('should return 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('/api/v1/categories/:id (PATCH)', () => {
    it('should update category', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Updated description', isActive: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.description).toBe('Updated description');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${categoryId}`)
        .send({ description: 'Test' })
        .expect(401);
    });
  });

  describe('/api/v1/categories/:id (DELETE)', () => {
    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .expect(401);
    });

    it('should delete category', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
