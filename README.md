<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">E-Commerce API</h1>

<p align="center">A modern, scalable e-commerce REST API built with NestJS, TypeScript, Prisma, and PostgreSQL</p>

## 📋 Description

A production-ready e-commerce backend API featuring user authentication, authorization, and comprehensive CRUD operations. Built with best practices including clean architecture, validation, error handling, and complete test coverage.

## ✨ Features

- 🔐 **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Role-based access control (USER, ADMIN)
  - Secure password hashing with bcrypt
  - Protected routes with guards

- 👥 **User Management**
  - User registration and login
  - Profile management
  - Password change functionality
  - Account deletion

- 📚 **API Documentation**
  - Auto-generated Swagger/OpenAPI documentation
  - Interactive API testing interface
  - Request/response examples

- 🛡️ **Security**
  - Input validation with class-validator
  - CORS configuration
  - Environment-based configuration
  - SQL injection protection via Prisma

- ✅ **Testing**
  - Comprehensive unit tests
  - End-to-end (e2e) tests
  - Test coverage reports

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Passport)
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest

## 📦 Project setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
$ npm install
```

### Database Setup

1. Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"

# JWT Secrets
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN=900  # 15 minutes in seconds

# Server
PORT=3000
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```

2. Run Prisma migrations:

```bash
# Generate Prisma Client
$ npx prisma generate

# Run migrations
$ npx prisma migrate dev

# (Optional) Seed the database
$ npx prisma db seed
```

## 🚀 Running the application

```bash
# development
$ npm run start

# watch mode (auto-reload)
$ npm run start:dev

# production mode
$ npm run start:prod
```

The API will be available at:
- **API Base URL:** `http://localhost:3000/api/v1`
- **Swagger Docs:** `http://localhost:3000/api/v1/docs`

## 🧪 Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov

# watch mode
$ npm run test:watch
```

## 📖 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login user | No |
| GET | `/api/v1/auth/refresh` | Refresh access token | Yes (Refresh Token) |
| POST | `/api/v1/auth/logout` | Logout user | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me` | Get current user profile | Yes |
| PATCH | `/api/v1/users/me` | Update current user | Yes |
| PATCH | `/api/v1/users/me/password` | Change password | Yes |
| DELETE | `/api/v1/users/me` | Delete account | Yes |
| GET | `/api/v1/users` | Get all users | Yes (Admin) |
| GET | `/api/v1/users/:id` | Get user by ID | Yes (Admin) |
| DELETE | `/api/v1/users/:id` | Delete user by ID | Yes (Admin) |

For detailed API documentation with request/response examples, visit the Swagger UI at `/api/v1/docs` when the server is running.

## 📁 Project Structure

```
api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── common/
│   │   ├── decorators/        # Custom decorators
│   │   └── guards/            # Auth guards
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   └── users/             # Users module
│   ├── prisma/                # Prisma service
│   ├── app.module.ts
│   └── main.ts
└── test/                      # E2E tests
```

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRES_IN` | Access token expiration (seconds) | 900 |
| `PORT` | Server port | 3000 |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | - |

## 🚢 Deployment

### Using Docker (Coming Soon)

```bash
# Build image
$ docker build -t ecommerce-api .

# Run container
$ docker run -p 3000:3000 ecommerce-api
```

### Prisma Commands

```bash
# Create migration
$ npx prisma migrate dev --name migration_name

# Apply migrations in production
$ npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
$ npx prisma studio

# Reset database (⚠️ Development only)
$ npx prisma migrate reset
```

## 📝 Code Style

```bash
# Format code
$ npm run format

# Lint code
$ npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is [MIT licensed](LICENSE).

## 🔗 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

