import { ApiProperty } from '@nestjs/swagger'
import { IsInt } from 'class-validator'
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Index('UX_CollectionRequirement_collection_mission', ['collectionId', 'missionId'], { unique: true })
@Index('IDX_CollectionRequirement_mission_collection', ['missionId', 'collectionId'])
@Entity({ name: 'CollectionRequirement' })
export class CollectionRequirement {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsInt()
  @ApiProperty({ title: 'Collection ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  collectionId: number

  @IsInt()
  @ApiProperty({ title: 'Mission ID (논리 FK)', format: 'int64' })
  @Column({ type: 'bigint' })
  missionId: number

  @IsInt()
  @ApiProperty({ title: '필요 완료 수', format: 'int32' })
  @Column({ type: 'int', default: 1 })
  requiredCount: number

  @IsInt()
  @ApiProperty({ title: '정렬 순서', format: 'int32' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number

  constructor(partial: Partial<CollectionRequirement>) {
    Object.assign(this, partial)
  }
}
