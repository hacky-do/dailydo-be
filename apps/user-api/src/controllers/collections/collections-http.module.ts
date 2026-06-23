import { CollectionModule } from '@data/domain/collection'
import { Module } from '@nestjs/common'

import { CollectionsController } from './collections.controller'

@Module({
  imports: [CollectionModule],
  controllers: [CollectionsController]
})
export class CollectionsHttpModule {}
