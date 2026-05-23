import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional, IsString, Length, Matches } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Index('UX_MyLog_item_active', ['dailyMissionItemId'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
@Index('UX_MyLog_share_slug', ['shareSlug'], {
  unique: true,
  where: '"shareSlug" IS NOT NULL',
})
@Index('IDX_MyLog_user_logDate', ['userId', 'logDate'], { where: '"deletedAt" IS NULL' })
@Entity({ name: 'MyLog' })
export class MyLog {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: '사용자 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  userId: number

  @IsInt()
  @ApiProperty({ title: 'DailyMission ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  dailyMissionId: number

  @IsInt()
  @ApiProperty({ title: 'DailyMissionItem ID (논리 FK, recordId)', format: 'int64' })
  @Column({ type: 'bigint' })
  dailyMissionItemId: number

  @IsInt()
  @ApiProperty({ title: 'Mission ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  missionId: number

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '사진 URL', required: false })
  @Column({ length: 500, nullable: true })
  photoUrl?: string

  @IsOptional()
  @Length(0, 200) // MEMO_MAX_LENGTH (INDEX §3.3(5))
  @ApiProperty({ title: '메모', maxLength: 200, required: false })
  @Column({ length: 200, nullable: true })
  memo?: string

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ title: '기록 날짜', description: 'KST YYYY-MM-DD (denormalized)' })
  @Column({ type: 'date' })
  logDate: string

  @IsBoolean()
  @ApiProperty({ title: '공유 여부' })
  @Column({ type: 'boolean', default: false })
  isShared: boolean

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '공유 slug', required: false })
  @Column({ length: 100, nullable: true })
  shareSlug?: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date

  constructor(partial: Partial<MyLog>) {
    Object.assign(this, partial)
  }
}
