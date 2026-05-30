import { PatchUserReqDto, UserService } from '@data/domain/user'
import { Auth, User } from '@data/decorators'
import { IdParamsDto } from '@data/dto'
import { Body, Controller, Get, ParseIntPipe, Patch } from '@nestjs/common'
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetUsersResDto } from './dto/res/get-users.res.dto'

@Auth({ type: 'user' })
@ApiTags('회원 정보')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  @ApiOperation({ summary: '회원 정보 조회' })
  @ApiOkResponse({ type: GetUsersResDto })
  @ApiNotFoundResponse({ description: 'not_found_user' })
  async get(@User('id', ParseIntPipe) userId: number): Promise<GetUsersResDto> {
    return await this.usersService.findOne(userId)
  }

  @Patch()
  @ApiOperation({ summary: '회원 정보 수정' })
  @ApiOkResponse({ type: IdParamsDto })
  @ApiNotFoundResponse({ description: 'not_found_user' })
  update(@User('id', ParseIntPipe) userId: number, @Body() data: PatchUserReqDto): Promise<IdParamsDto> {
    return this.usersService.update(userId, data)
  }
  //
  // @Delete()
  // @HttpCode(204)
  // @ApiOperation({summary: '회원 탈퇴'})
  // @ApiResponse({status: 204})
  // delete(@User('id', ParseIntPipe) userId: number): Promise<void> {
  //   return this.usersService.delete(userId)
  // }
}
