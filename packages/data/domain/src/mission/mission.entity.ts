import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { MissionType } from '../_shared/cycle'

@Index('IDX_Mission_active_type', ['isActive', 'type'], { where: '"isActive" = true' })
@Entity({ name: 'Mission' })
export class Mission {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: '카테고리 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  categoryId: number

  @Length(1, 100)
  @ApiProperty({ minLength: 1, maxLength: 100, title: '제목' })
  @Column({ length: 100 })
  title: string

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '설명', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '이미지 URL', required: false })
  @Column({ length: 500, nullable: true })
  imageUrl?: string

  @IsEnum(MissionType)
  @ApiProperty({ enum: MissionType, title: '미션 타입' })
  @Column({ type: 'enum', enum: MissionType, default: MissionType.NORMAL })
  type: MissionType

  @IsBoolean()
  @ApiProperty({ title: '활성 여부' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @IsInt()
  @ApiProperty({ title: '글로벌 누적 완료수', format: 'int64' })
  @Column({ type: 'bigint', default: 0 })
  totalCompletedCount: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  constructor(partial: Partial<Mission>) {
    Object.assign(this, partial)
  }
}
