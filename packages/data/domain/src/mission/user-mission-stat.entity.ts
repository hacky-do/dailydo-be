import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional } from 'class-validator'
import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Index('UX_UserMissionStat_user_mission', ['userId', 'missionId'], { unique: true })
@Entity({ name: 'UserMissionStat' })
export class UserMissionStat {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: '사용자 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  userId: number

  @IsInt()
  @ApiProperty({ title: 'Mission ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  missionId: number

  @IsInt()
  @ApiProperty({ title: '개인 누적 완료수', format: 'int64' })
  @Column({ type: 'bigint', default: 0 })
  completedCount: number

  @IsOptional()
  @ApiProperty({ title: '마지막 완료 시각', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  lastCompletedAt?: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  constructor(partial: Partial<UserMissionStat>) {
    Object.assign(this, partial)
  }
}
