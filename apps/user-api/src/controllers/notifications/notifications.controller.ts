import { Auth, User } from '@data/decorators'
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common'
import { NotificationService } from '@data/domain/notification/notification.service'
import { GetNotificationsResDto } from '@data/domain/notification/dto/res/get-notifications.res.dto'
import { GetNotificationsReqDto } from '@data/domain/notification/dto/req/get-notifications.req.dto'
import { IdParamsDto } from '@data/dto/id-params.dto'
import { RecipientType } from '@data/domain/notification/types/notification.types'

@Auth({ type: 'user' })
@ApiTags('알림 관리')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  @ApiOkResponse({ type: GetNotificationsResDto })
  async findAll(
    @User('id', ParseIntPipe) userId: number,
    @Query() query: GetNotificationsReqDto
  ): Promise<GetNotificationsResDto> {
    return await this.notificationService.findAll(userId, RecipientType.user, query)
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: '- not_found_notification_info: 알림을 찾을 수 없음' })
  async updateNotificationStatus(
    @User('id', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) notificationId: number
  ): Promise<IdParamsDto> {
    return await this.notificationService.updateNotificationStatus(userId, notificationId)
  }

  @Patch('read-all')
  @ApiOperation({ summary: '모든 알림 읽음 처리' })
  @ApiOkResponse()
  async updateAllNotificationStatus(@User('id', ParseIntPipe) userId: number): Promise<void> {
    return await this.notificationService.updateAllNotificationStatus(userId, RecipientType.user)
  }
}
