import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsInt, Length } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'CollectionGroup' })
export class CollectionGroup {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Length(1, 100)
  @ApiProperty({ minLength: 1, maxLength: 100, title: '그룹/카테고리명' })
  @Column({ length: 100 })
  name: string

  @IsBoolean()
  @ApiProperty({ title: '활성 여부' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean

  @IsInt()
  @ApiProperty({ title: '정렬 순서', format: 'int32' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date

  constructor(partial: Partial<CollectionGroup>) {
    Object.assign(this, partial)
  }
}
