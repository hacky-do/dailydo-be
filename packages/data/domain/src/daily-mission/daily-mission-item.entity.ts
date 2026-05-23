import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Index('UX_DailyMissionItem_batch_mission', ['dailyMissionId', 'missionId'], { unique: true })
@Index('IDX_DailyMissionItem_batch_completed', ['dailyMissionId', 'isCompleted'])
@Entity({ name: 'DailyMissionItem' })
export class DailyMissionItem {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: 'DailyMission ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  dailyMissionId: number

  @IsInt()
  @ApiProperty({ title: 'Mission ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  missionId: number

  // 저장된 item 은 항상 selected. 향후 재선택 정책 대비 + 명시성으로 유지.
  @IsBoolean()
  @ApiProperty({ title: '선택 여부 (저장 item은 항상 true)' })
  @Column({ type: 'boolean', default: true })
  isSelected: boolean

  @ApiProperty({ title: '선택 시각' })
  @Column({ type: 'timestamptz' })
  selectedAt: Date

  @IsBoolean()
  @ApiProperty({ title: '완료 여부' })
  @Column({ type: 'boolean', default: false })
  isCompleted: boolean

  @IsOptional()
  @ApiProperty({ title: '완료 시각', required: false })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  constructor(partial: Partial<DailyMissionItem>) {
    Object.assign(this, partial)
  }
}
