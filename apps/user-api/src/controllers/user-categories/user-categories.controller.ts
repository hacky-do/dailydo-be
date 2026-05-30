import {
  GetUserCategoriesResDto,
  GetUserCategoriesReqDto,
  PatchUserCategoryReqDto,
  PostUserCategoryReqDto,
  PostUserCategoryResDto,
  UserCategoryService
} from '@data/domain/user'
import { Auth, User } from '@data/decorators'
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
@ApiTags('회원 관리 - 나의 미션 카테고리')
@Controller()
export class UserCategoriesController {
  constructor(private readonly userCategoryService: UserCategoryService) {}

  @Get('users/categories')
  @ApiOperation({ summary: '나의 카테고리 목록 조회' })
  @ApiOkResponse({ type: GetUserCategoriesResDto })
  getMyCategories(
    @User('id', ParseIntPipe) userId: number,
    @Query() params: GetUserCategoriesReqDto
  ): Promise<GetUserCategoriesResDto> {
    return this.userCategoryService.getMyCategories(userId, params)
  }

  @Post('users/categories')
  @ApiOperation({ summary: '나의 카테고리 생성' })
  @ApiCreatedResponse({ type: PostUserCategoryResDto })
  @ApiNotFoundResponse({ description: 'not_found_category' })
  @ApiConflictResponse({ description: 'duplicate_category' })
  createMyCategory(
    @User('id', ParseIntPipe) userId: number,
    @Body() data: PostUserCategoryReqDto
  ): Promise<PostUserCategoryResDto> {
    return this.userCategoryService.createMyCategory(userId, data)
  }

  @Patch('users/categories/:id')
  @ApiOperation({ summary: '나의 카테고리 수정' })
  @ApiOkResponse({ type: IdParamsDto })
  @ApiNotFoundResponse({ description: 'not_found_user_category / not_found_category' })
  @ApiConflictResponse({ description: 'duplicate_category' })
  updateMyCategory(
    @User('id', ParseIntPipe) userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: PatchUserCategoryReqDto
  ): Promise<IdParamsDto> {
    return this.userCategoryService.updateMyCategory(userId, id, data)
  }

  @Delete('users/categories/:id')
  @HttpCode(204)
  @ApiOperation({ summary: '나의 카테고리 삭제' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'not_found_user_category' })
  deleteMyCategory(@User('id', ParseIntPipe) userId: number, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userCategoryService.deleteMyCategory(userId, id)
  }
}
