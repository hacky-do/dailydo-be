import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { IsDate, IsInt } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm'
import { User } from './user.entity'

@Index('UX_UserMissionCategory_user_category', ['userId', 'categoryId'], { unique: true })
@Entity({ name: 'UserMissionCategory' })
export class UserMissionCategory {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: '사용자 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  userId: number

  @IsInt()
  @ApiProperty({ title: '카테고리 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  categoryId: number

  @IsInt()
  @ApiProperty({ title: '정렬 순서', format: 'int32' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number

  @IsDate()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @IsDate()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  @ApiHideProperty()
  @ManyToOne(() => User, (user) => user.missionCategories, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: Relation<User>

  constructor(partial: Partial<UserMissionCategory>) {
    Object.assign(this, partial)
  }
}
