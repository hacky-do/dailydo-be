import { UserAccountType } from '@data/domain/user'
import { Auth, Public, User } from '@data/decorators'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  Res,
  UnauthorizedException
} from '@nestjs/common'
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CookieService } from '@system/cookie'
import { JwtStrategy } from '../../strategies/jwt.strategy'
import { AuthService } from './auth.service'
import { DeleteAuthReqDto } from './dto/req/delete-auth.req.dto'
import { GetAuthOauth2ReqDto } from './dto/req/get-auth-oauth2.req.dto'
import { PostAuthOauth2TokenReqDto } from './dto/req/post-auth-oauth2-token.req.dto'
import { PostAuthRefreshReqDto } from './dto/req/post-auth-refresh.req.dto'
import { PostAuthRegisterReqDto } from './dto/req/post-auth-register.req.dto'
import { PostAuthSocialReqDto } from './dto/req/post-auth-social.req.dto'
import { PostAuthReqDto } from './dto/req/post-auth.req.dto'
import { PutAuthPasswordReqDto } from './dto/req/put-auth-password.req.dto'
import { GetAuthResDto } from './dto/res/get-auth.res.dto'
import { PostAuthSocialTokenResDto } from './dto/res/post-auth-social-token.res.dto'
import { PostAuthResDto } from './dto/res/post-auth.res.dto'
import type { FastifyRequest, FastifyReply } from 'fastify'

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly cookieService: CookieService,
    private readonly authService: AuthService
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({ status: 201, type: PostAuthResDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async postRegister(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: PostAuthRegisterReqDto
  ): Promise<PostAuthResDto> {
    const ret = await this.authService.register({ type: UserAccountType.email, ...data })
    this.setTokenCookies(res, ret.accessToken, ret.refreshToken)
    return ret
  }

  @Get()
  @Auth({ type: 'user' })
  @ApiOperation({ summary: '로그인 세션 확인' })
  @ApiResponse({ status: 200, type: GetAuthResDto })
  async getAuth(@User() user: any): Promise<GetAuthResDto> {
    if (!user?.id) {
      throw new UnauthorizedException('invalid_access_token')
    }
    return { id: Number(user.id), name: user.name }
  }

  @Public()
  @Post()
  @ApiOperation({ summary: '로그인' })
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PostAuthResDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async postAuth(@Res({ passthrough: true }) res: FastifyReply, @Body() data: PostAuthReqDto): Promise<PostAuthResDto> {
    const ret = await this.authService.validateUserByEmail(data.email, data.password)
    this.setTokenCookies(res, ret.accessToken, ret.refreshToken)
    return ret
  }

  @Public()
  @Post('social')
  @ApiOperation({ summary: '소셜 로그인' })
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PostAuthResDto })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async postAuthSocial(
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: PostAuthSocialReqDto
  ): Promise<PostAuthResDto> {
    const ret = await this.authService.validateUserBySocial(data.type, data.token)
    this.setTokenCookies(res, ret.accessToken, ret.refreshToken)
    return ret
  }

  @Public()
  @HttpCode(200)
  @Post('social/token')
  @ApiOperation({
    summary: 'App - 소셜 토큰 검증. 응답 받은 토큰으로 로그인, 회원가입에 사용'
  })
  @ApiResponse({ status: 200, type: PostAuthSocialTokenResDto })
  async postOauth2Token(@Body() data: PostAuthOauth2TokenReqDto): Promise<PostAuthSocialTokenResDto> {
    return await this.authService.validateSocialToken(data.type, data.socialToken)
  }

  @Public()
  @Redirect()
  @Get('oauth2')
  @ApiOperation({
    summary: 'Web - Oauth2 로그인 페이지',
    description: '302 응답으로 브라우저에서 호출해야함. 결과는 redirectUri로 리다이렉트 됨.'
  })
  getOauth2(@Query() params: GetAuthOauth2ReqDto) {
    const url = `/auth/oauth2/authorization/${params.type}`
    const search = new URLSearchParams()
    search.append('redirectUri', params.redirectUri)
    return {
      url: `${url}?${search.toString()}`,
      statusCode: 302
    }
  }

  @Public()
  @ApiCookieAuth()
  @ApiBearerAuth()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh Token' })
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PostAuthResDto })
  async postRefresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() data: PostAuthRefreshReqDto
  ): Promise<PostAuthResDto> {
    let token = data.refreshToken
    if (!token) {
      token = this.cookieService.getCookieValue(req, JwtStrategy.REFRESH_COOKIE_NAME)
    }
    if (token) {
      const ret = await this.authService.refreshToken(token)
      this.setTokenCookies(res, ret.accessToken, ret.refreshToken)
      return ret
    }
    throw new UnauthorizedException('invalid_refresh_token')
  }

  @Put('password')
  @Auth({ type: 'user' })
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, type: PostAuthResDto })
  async putAuthPassword(@User('id') userId: number, @Body() data: PutAuthPasswordReqDto): Promise<PostAuthResDto> {
    return this.authService.changePassword({ ...data, userId })
  }

  @Public()
  @Delete()
  @ApiCookieAuth()
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiResponse({ status: 204 })
  @ApiOperation({ summary: '로그아웃' })
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @User('id') userId: number,
    @Query() params: DeleteAuthReqDto
  ): Promise<void> {
    let token = params.refreshToken
    if (!token) {
      token = this.cookieService.getCookieValue(req, JwtStrategy.REFRESH_COOKIE_NAME)
    }
    if (token && userId) {
      await this.authService.logout(userId, token)
    }
    this.deleteTokenCookies(res)
  }

  private setTokenCookies(res: FastifyReply, accessToken: string, refreshToken: string) {
    this.cookieService.setCookie(res, JwtStrategy.ACCESS_COOKIE_NAME, accessToken, JwtStrategy.EXPIRE_IN_ACCESS_TOKEN)
    this.cookieService.setCookie(
      res,
      JwtStrategy.REFRESH_COOKIE_NAME,
      refreshToken,
      JwtStrategy.EXPIRE_IN_REFRESH_TOKEN
    )
  }

  private deleteTokenCookies(res: FastifyReply) {
    this.cookieService.deleteCookies(res, [JwtStrategy.ACCESS_COOKIE_NAME, JwtStrategy.REFRESH_COOKIE_NAME])
  }
}
