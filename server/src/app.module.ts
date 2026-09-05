import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { QuestionsModule } from './questions/questions.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AppThrottlerGuard } from './common/app-throttler.guard';
import { throttlerLimits } from './common/throttler.config';

const limits = throttlerLimits();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: limits.ttl,
        limit: limits.defaultLimit,
      },
    ]),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-platform',
    ),
    UsersModule,
    AuthModule,
    UploadsModule,
    VideosModule,
    QuestionsModule,
    AssignmentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
