import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDate, IsInt } from 'class-validator'
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('UX_UserCollection_user_collection', ['userId', 'collectionId'], { unique: true })
@Index('UX_UserCollection_user_featured', ['userId'], {
  unique: true,
  where: '"isFeatured" = true'
})
@Index('IDX_UserCollection_collection', ['collectionId'])
@Entity({ name: 'UserCollection' })
export class UserCollection {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: '사용자 ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  userId: number

  @IsInt()
  @ApiProperty({ title: 'Collection ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  collectionId: number

  @IsDate()
  @ApiProperty({ title: '획득 시각' })
  @Column({ type: 'timestamptz' })
  acquiredAt: Date

  @IsBoolean()
  @ApiProperty({ title: '대표 컬렉션 여부' })
  @Column({ type: 'boolean', default: false })
  isFeatured: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date

  constructor(partial: Partial<UserCollection>) {
    Object.assign(this, partial)
  }
}
