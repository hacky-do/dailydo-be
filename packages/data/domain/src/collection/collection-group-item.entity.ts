import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('UX_CollectionGroupItem_group_collection', ['groupId', 'collectionId'], { unique: true })
@Index('IDX_CollectionGroupItem_collection', ['collectionId'])
@Entity({ name: 'CollectionGroupItem' })
export class CollectionGroupItem {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: 'CollectionGroup ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  groupId: number

  @IsInt()
  @ApiProperty({ title: 'Collection ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  collectionId: number

  @IsInt()
  @ApiProperty({ title: '정렬 순서', format: 'int32' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number

  constructor(partial: Partial<CollectionGroupItem>) {
    Object.assign(this, partial)
  }
}
