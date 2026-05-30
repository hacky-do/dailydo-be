import {
  GetMissionCategoriesResDto,
  GetMissionCategoriesReqDto,
  MissionCategoryItemDto,
  MissionCategoryService,
  PatchMissionCategoryReqDto,
  PostMissionCategoryReqDto,
  PostMissionCategoryResDto
} from '@data/domain/mission-category'
import { Auth } from '@data/decorators'
import { IdParamsDto } from '@data/dto'
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'

@Auth({ type: 'user' })
@ApiTags('미션 카테고리 관리')
@Controller('mission-categories')
export class MissionCategoriesController {
  constructor(private readonly missionCategoryService: MissionCategoryService) {}

  @Get()
  @ApiOperation({ summary: '미션 카테고리 목록 조회' })
  @ApiOkResponse({ type: GetMissionCategoriesResDto })
  getMissionCategories(@Query() params: GetMissionCategoriesReqDto): Promise<GetMissionCategoriesResDto> {
    return this.missionCategoryService.findAll(params)
  }

  @Get(':id')
  @ApiOperation({ summary: '미션 카테고리 상세 조회' })
  @ApiOkResponse({ type: MissionCategoryItemDto })
  @ApiNotFoundResponse({ description: 'not_found_category' })
  getMissionCategory(@Param('id', ParseIntPipe) id: number): Promise<MissionCategoryItemDto> {
    return this.missionCategoryService.findOne(id)
  }

  @Post()
  @ApiOperation({ summary: '미션 카테고리 생성' })
  @ApiCreatedResponse({ type: PostMissionCategoryResDto })
  @ApiConflictResponse({ description: 'duplicate_category' })
  createMissionCategory(@Body() data: PostMissionCategoryReqDto): Promise<PostMissionCategoryResDto> {
    return this.missionCategoryService.create(data)
  }

  @Patch(':id')
  @ApiOperation({ summary: '미션 카테고리 수정' })
  @ApiOkResponse({ type: IdParamsDto })
  @ApiNotFoundResponse({ description: 'not_found_category' })
  @ApiConflictResponse({ description: 'duplicate_category' })
  updateMissionCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: PatchMissionCategoryReqDto
  ): Promise<IdParamsDto> {
    return this.missionCategoryService.update(id, data)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: '미션 카테고리 삭제' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'not_found_category' })
  deleteMissionCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.missionCategoryService.delete(id)
  }
}
