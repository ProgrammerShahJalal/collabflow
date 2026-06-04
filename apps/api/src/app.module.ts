import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import mikroOrmConfig from './mikro-orm.config';
import { UploadsModule } from './uploads/uploads.module';
import { uploadDir } from './uploads/uploads.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActivitiesModule } from './activities/activities.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 300 },
    ]),
    MikroOrmModule.forRoot(mikroOrmConfig),
    // Serve uploaded attachments at /uploads/<file>. This sits outside the
    // global 'api/v1' prefix (which only applies to controllers) and is public
    // by design — file links open directly in the browser without a Bearer
    // token, and filenames are unguessable UUIDs.
    ServeStaticModule.forRoot({
      rootPath: uploadDir(),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    AnalyticsModule,
    ActivitiesModule,
    CommentsModule,
    NotificationsModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new JwtAuthGuard(reflector),
      inject: [Reflector],
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
