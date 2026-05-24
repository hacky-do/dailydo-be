import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Length } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'MissionCategory' })
export class MissionCategory {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Length(1, 50)
  @ApiProperty({ minLength: 1, maxLength: 50, title: '카테고리명' })
  @Column({ length: 50, unique: true })
  name: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  constructor(partial: Partial<MissionCategory>) {
    Object.assign(this, partial)
  }
}
