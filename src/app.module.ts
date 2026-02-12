import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';
import { UsersModule } from './modules/users/users.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CategoryModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
