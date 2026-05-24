import { VerificationService } from '@data/domain/verification'
import { Public } from '@data/decorators'
import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PostVerificationConfirmReqDto } from './dto/req/post-verification-confirm.req.dto'
import { PostVerificationEmailReqDto } from './dto/req/post-verification-email.req.dto'
import { PostVerificationPhoneReqDto } from './dto/req/post-verification-phone.req.dto'
import { PostVerificationConfirmResDto } from './dto/res/post-verification-confirm.res.dto'
import { PostVerificationResDto } from './dto/res/post-verification.res.dto'

@ApiTags('OTP 인증')
@Controller('verification')
export class VerificationsController {
  constructor(private readonly verificationService: VerificationService) {}

  @Public()
  @Post('email')
  @ApiOperation({ summary: 'OTP 생성 및 SMS 전송. 개발 서버에서는 Response에서 확인 가능' })
  @ApiResponse({ status: 201, type: PostVerificationResDto })
  @ApiResponse({ status: 404, description: '해당 계정으로 가입한 유저가 없음' })
  @ApiResponse({ status: 409, description: '이미 가입된 계정' })
  async email(@Body() data: PostVerificationEmailReqDto): Promise<PostVerificationResDto> {
    return this.verificationService.create(data)
  }

  @Public()
  @Post('phone')
  @ApiOperation({ summary: 'OTP 생성 및 SMS 전송. 개발 서버에서는 Response에서 확인 가능' })
  @ApiResponse({ status: 201, type: PostVerificationResDto })
  @ApiResponse({ status: 404, description: '해당 계정으로 가입한 유저가 없음' })
  @ApiResponse({ status: 409, description: '이미 가입된 계정' })
  async phone(@Body() data: PostVerificationPhoneReqDto): Promise<PostVerificationResDto> {
    return this.verificationService.create(data)
  }

  @Public()
  @Post('confirm')
  @ApiOperation({ summary: 'OTP 인증' })
  @HttpCode(200)
  @ApiResponse({ status: 200, type: PostVerificationConfirmResDto })
  @ApiResponse({ status: 401, description: 'Invalid Request' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async confirm(@Body() data: PostVerificationConfirmReqDto): Promise<PostVerificationConfirmResDto> {
    const codeToken = await this.verificationService.confirm(data.code, data.codeToken)
    return { codeToken }
  }
}
