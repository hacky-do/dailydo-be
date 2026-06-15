import {
  GetUserCategoriesResDto,
  GetUserCategoriesReqDto,
  PutUserCategoryReqDto,
  UserCategoryService
} from '@data/domain/user'
import { Auth, User } from '@data/decorators'
import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Put, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse,
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

  @Put('users/categories')
  @ApiOperation({ summary: '나의 카테고리 설정 (전체 교체)' })
  @ApiOkResponse({ schema: { properties: { categoryIds: { type: 'array', items: { type: 'number' } } } } })
  @ApiBadRequestResponse({ description: 'invalid_category' })
  updateMyCategories(
    @User('id', ParseIntPipe) userId: number,
    @Body() data: PutUserCategoryReqDto
  ): Promise<{ categoryIds: number[] }> {
    return this.userCategoryService.updateMyCategories(userId, data.categoryIds)
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
