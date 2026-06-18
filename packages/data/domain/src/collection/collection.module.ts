import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CollectionGroupItem } from './collection-group-item.entity'
import { CollectionGroup } from './collection-group.entity'
import { CollectionRequirement } from './collection-requirement.entity'
import { Collection } from './collection.entity'
import { CollectionService } from './collection.service'
import { UserCollection } from './user-collection.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Collection, CollectionRequirement, UserCollection, CollectionGroup, CollectionGroupItem])
  ],
  providers: [CollectionService],
  exports: [TypeOrmModule, CollectionService]
})
export class CollectionModule {}
