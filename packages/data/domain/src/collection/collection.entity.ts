import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum CollectionType {
  NORMAL = 'NORMAL',
  SPECIAL = 'SPECIAL'
}

@Entity({ name: 'Collection' })
export class Collection {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @Length(1, 100)
  @ApiProperty({ minLength: 1, maxLength: 100, title: '컬렉션 이름' })
  @Column({ length: 100 })
  title: string

  @IsString()
  @ApiProperty({ title: '설명' })
  @Column({ type: 'text' })
  description: string

  @IsOptional()
  @IsString()
  @ApiProperty({ title: '이미지 URL', required: false, nullable: true })
  @Column({ length: 500, nullable: true })
  imageUrl?: string

  @IsEnum(CollectionType)
  @ApiProperty({ enum: CollectionType, title: '컬렉션 타입' })
  @Column({
    type: 'enum',
    enum: CollectionType,
    enumName: 'Collection_type_enum',
    default: CollectionType.NORMAL
  })
  type: CollectionType

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

  constructor(partial: Partial<Collection>) {
    Object.assign(this, partial)
  }
}
