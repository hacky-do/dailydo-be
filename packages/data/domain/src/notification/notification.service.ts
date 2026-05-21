import { Notification } from './notification.entity'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NotificationType, RecipientType, TargetType } from './types/notification.types'
import { GetNotificationsReqDto } from './dto/req/get-notifications.req.dto'
import { GetNotificationsResDto } from './dto/res/get-notifications.res.dto'
import dayjs from 'dayjs'
import { NotificationData, PostNotificationReqDto } from './dto/req/post-notification.req.dto'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { IdParamsDto } from '@data/dto'

dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>
  ) {}

  async findAll(
    recipientId: number,
    recipientType: RecipientType,
    params: GetNotificationsReqDto
  ): Promise<GetNotificationsResDto> {
    const { type, isRead, start, perPage } = params
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.recipientId = :recipientId', { recipientId })
      .andWhere('notification.recipientType = :recipientType', { recipientType })
      .andWhere('notification.createdAt >= :thirtyDaysAgo', {
        thirtyDaysAgo: dayjs().subtract(30, 'day').toDate()
      })

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type: type })
    }

    if (typeof isRead === 'boolean') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: isRead })
    }

    const [notifications, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(start)
      .take(perPage)
      .getManyAndCount()

    return {
      data: notifications.map((notification) => ({
        ...notification,
        displayTime: this.formatDisplayTime(notification.createdAt)
      })),
      total
    }
  }

  async create(data: PostNotificationReqDto): Promise<IdParamsDto> {
    const notificationData = data.data || {}

    const notification = new Notification({
      recipientId: data.recipientId,
      recipientType: data.recipientType,
      type: data.type,
      title: this.getNotificationTitle(data.type),
      content: this.getNotificationContent(data.type, notificationData),
      targetInfo: {
        type: this.getTargetType(data.type),
        id: data.targetId
      },
      isRead: false
    })

    const saved = await this.notificationRepository.save(notification)
    return { id: saved.id }
  }

  async updateNotificationStatus(recipientId: number, notificationId: number): Promise<IdParamsDto> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('id = :notificationId', { notificationId })
      .andWhere('recipientId = :recipientId', { recipientId })
      .execute()

    if (result.affected === 0) {
      throw new NotFoundException('not_found_notification_info')
    }

    return { id: notificationId }
  }

  async updateAllNotificationStatus(recipientId: number, recipientType: RecipientType): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('recipientId = :recipientId', { recipientId })
      .andWhere('recipientType = :recipientType', { recipientType })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute()
  }

  async deleteExpiredNotifications(): Promise<number> {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate()
    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .execute()

    return result.affected || 0
  }

  private getNotificationTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.userWelcome:
        return 'dailydo에 오신 걸 환영해요!'
      default:
        return '알림'
    }
  }

  private getNotificationContent(type: NotificationType, data: NotificationData): string {
    const { userName = '' } = data

    switch (type) {
      case NotificationType.userWelcome:
        return '이제 코딩 스킬을 레벨업할 준비가 되셨나요? 프로필을 완성하고, 나에게 맞는 활동을 시작해보세요.'
      default:
        return userName ? `'${userName}'님에게 알림이 도착했어요.` : '새로운 알림이 도착했어요.'
    }
  }

  private formatDisplayTime(date: Date): string {
    const now = dayjs()
    const target = dayjs(date)

    if (now.diff(target, 'minute') < 1) return '방금'
    if (now.diff(target, 'hour') < 1) return `${now.diff(target, 'minute')}분 전`
    if (now.diff(target, 'day') < 1) return `${now.diff(target, 'hour')}시간 전`
    if (now.diff(target, 'day') <= 30) return `${now.diff(target, 'day')}일 전`
    return null
  }

  private getTargetType(type: NotificationType): TargetType {
    switch (type) {
      default:
        return TargetType.other
    }
  }
}
