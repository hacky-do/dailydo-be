import { Auth, User } from '@data/decorators'
import {
  CollectionService,
  DeleteFeaturedReqDto,
  FeaturedCollectionResDto,
  GetCollectionsResDto,
  SetFeaturedReqDto
} from '@data/domain/collection'
import { Body, Controller, Delete, Get, HttpCode, ParseIntPipe, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('컬렉션')
@Auth({ type: 'user' })
@Controller('api/users')
export class CollectionsController {
  constructor(private readonly collectionService: CollectionService) {}

  @Get('collections')
  @ApiOperation({ summary: '컬렉션 전체 보기' })
  @ApiOkResponse({ type: GetCollectionsResDto })
  getCollections(@User('id', ParseIntPipe) userId: number): Promise<GetCollectionsResDto> {
    return this.collectionService.getCollections(userId)
  }

  @Get('me/collections/featured')
  @ApiOperation({ summary: '나의 대표 컬렉션 조회' })
  @ApiOkResponse({ type: FeaturedCollectionResDto })
  getFeaturedCollection(@User('id', ParseIntPipe) userId: number): Promise<FeaturedCollectionResDto | null> {
    return this.collectionService.getFeaturedCollection(userId)
  }

  @Post('me/collections/featured')
  @HttpCode(200)
  @ApiOperation({ summary: '나의 대표 컬렉션 등록' })
  @ApiOkResponse({ type: FeaturedCollectionResDto })
  setFeaturedCollection(
    @User('id', ParseIntPipe) userId: number,
    @Body() dto: SetFeaturedReqDto
  ): Promise<FeaturedCollectionResDto> {
    return this.collectionService.setFeatured(userId, dto.collectionId)
  }

  @Delete('me/collections/featured')
  @HttpCode(204)
  @ApiOperation({ summary: '나의 대표 컬렉션 삭제' })
  @ApiNoContentResponse()
  deleteFeaturedCollection(@User('id', ParseIntPipe) userId: number, @Body() dto: DeleteFeaturedReqDto): Promise<void> {
    return this.collectionService.deleteFeatured(userId, dto.collectionId)
  }
}
