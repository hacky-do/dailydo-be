import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsInt, IsOptional, Matches } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { DailyMissionStatus } from '../_shared/cycle'

@Index('UX_DailyMission_user_date', ['userId', 'missionDate'], { unique: true })
@Entity({ name: 'DailyMission' })
export class DailyMission {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: '사용자 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  userId: number

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ title: '미션 날짜', description: 'KST YYYY-MM-DD' })
  @Column({ type: 'date' })
  missionDate: string

  @IsEnum(DailyMissionStatus)
  @ApiProperty({ enum: DailyMissionStatus, title: '상태 (저장값은 CONFIRMED만)' })
  @Column({ type: 'enum', enum: DailyMissionStatus, default: DailyMissionStatus.CONFIRMED })
  status: DailyMissionStatus

  @ApiProperty({ title: '도착 시각' })
  @Column({ type: 'timestamptz' })
  arrivedAt: Date

  @IsOptional()
  @ApiProperty({ title: '확정 시각', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  constructor(partial: Partial<DailyMission>) {
    Object.assign(this, partial)
  }
}
