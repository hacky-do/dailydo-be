import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDate, IsEnum, IsInt, Length, ValidateNested } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { NotificationType, RecipientType, TargetInfo } from './types/notification.types'
import { Type } from 'class-transformer'

@Entity({ name: 'Notification' })
export class Notification {
  @IsInt()
  @PrimaryGeneratedColumn()
  id: number

  @IsInt()
  @ApiProperty({ description: '알림 수신자 ID' })
  @Column()
  recipientId: number

  @IsEnum(RecipientType)
  @ApiProperty({ title: '알림 수신자 타입 (user: 일반 사용자, ceo: 사업자)' })
  @Column({ type: 'enum', enum: RecipientType })
  recipientType: RecipientType

  @IsEnum(NotificationType)
  @ApiProperty({
    enum: NotificationType,
    title: '알림 타입'
  })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType

  @Length(1, 40)
  @ApiProperty({ minLength: 1, maxLength: 40, title: '제목' })
  @Column({ length: 40 })
  title: string

  @Length(1, 200)
  @ApiProperty({ minLength: 1, maxLength: 200, title: '내용' })
  @Column({ length: 200 })
  content: string

  @ValidateNested()
  @Type(() => TargetInfo)
  @ApiProperty({
    type: TargetInfo,
    description: '알림 타겟 정보 (클릭 시 이동할 페이지 관련 정보)',
    example: { type: 'project', id: 1 }
  })
  @Column('json')
  targetInfo: TargetInfo

  @IsBoolean()
  @ApiProperty({ title: '읽음 여부' })
  @Column({ type: 'boolean', default: false })
  isRead: boolean

  @IsDate()
  @CreateDateColumn()
  createdAt: Date

  constructor(partial: Partial<Notification>) {
    Object.assign(this, partial)
  }
}
