import { Module } from '@nestjs/common'
import { AuthHttpModule } from './auth/auth-http.module'
import { FilesHttpModule } from './files/files-http.module'
import { MissionsHttpModule } from './missions/missions-http.module'
import { MylogsHttpModule } from './mylogs/mylogs-http.module'
import { NotificationsHttpModule } from './notifications/notifications-http.module'
import { UsersHttpModule } from './users/users-http.module'
import { VerificationsHttpModule } from './verifications/verifications-http.module'

@Module({
  imports: [
    AuthHttpModule,
    VerificationsHttpModule,
    UsersHttpModule,
    NotificationsHttpModule,
    FilesHttpModule,
    MissionsHttpModule,
    MylogsHttpModule,
  ],
  controllers: [],
})
export class UserHttpModule {}
