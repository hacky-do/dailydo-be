import { UserService } from '@data/domain/user'
import { Auth, User } from '@data/decorators'
import { Controller, Get, ParseIntPipe } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GetUsersResDto } from './dto/res/get-users.res.dto'

@Auth({ type: 'user' })
@ApiTags('회원 정보')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  @ApiOperation({ summary: '회원 정보 조회' })
  @ApiResponse({ status: 200, type: GetUsersResDto })
  async get(@User('id', ParseIntPipe) userId: number): Promise<GetUsersResDto> {
    return await this.usersService.findOne(userId)
  }

  // @Patch()
  // @ApiOperation({summary: '회원 정보 수정'})
  // @ApiResponse({status: 200, type: IdParamsDto})
  // update(@User('id', ParseIntPipe) userId: number, @Body() data: PatchUserReqDto): Promise<IdParamsDto> {
  //   return this.usersService.update(userId, data)
  // }
  //
  // @Delete()
  // @HttpCode(204)
  // @ApiOperation({summary: '회원 탈퇴'})
  // @ApiResponse({status: 204})
  // delete(@User('id', ParseIntPipe) userId: number): Promise<void> {
  //   return this.usersService.delete(userId)
  // }
}
