import { CollectionModule } from '@data/domain/collection'
import { Module } from '@nestjs/common'

import { CollectionsAdminController } from './collections-admin.controller'
import { CollectionsController } from './collections.controller'

@Module({
  imports: [CollectionModule],
  controllers: [CollectionsController, CollectionsAdminController]
})
export class CollectionsHttpModule {}
