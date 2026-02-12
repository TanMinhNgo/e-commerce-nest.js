import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  const testUser = {
    email: 'userstest@example.com',
    password: 'Password@123',
    firstName: 'Test',
    lastName: 'User',
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

    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    // Create test user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });

    await app.close();
  });

  describe('/api/v1/users/me (GET)', () => {
    it('should get user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('lastName');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });
  });

  describe('/api/v1/users/me (PATCH)', () => {
    it('should update user profile', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
          expect(res.body.lastName).toBe('Name');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({
          firstName: 'Test',
        })
        .expect(401);
    });
  });

  describe('/api/v1/users/me/password (PATCH)', () => {
    it('should change password', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewPassword@123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Password changed successfully');
        });
    });

    it('should fail with incorrect current password', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'NewPassword@456',
        })
        .expect(404);
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewPassword@123',
        })
        .expect(401);
    });

    // Change password back for other tests
    afterAll(async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'NewPassword@123',
          newPassword: 'Password@123',
        });
    });
  });

  describe('/api/v1/users (GET) - Admin only', () => {
    it('should fail for non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/:id (GET) - Admin only', () => {
    it('should fail for non-admin users', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/:id (DELETE) - Admin only', () => {
    it('should fail for non-admin users', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });
  });

  describe('/api/v1/users/me (DELETE)', () => {
    it('should delete user account', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('User deleted successfully');
        });
    });

    it('should fail to get profile after deletion', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });
  });
});
