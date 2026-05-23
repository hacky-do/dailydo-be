import { Auth, User } from '@data/decorators'
import { GetMylogsCalendarReqDto } from '@data/domain/my-log/dto/req/get-mylogs-calendar.req.dto'
import { PatchMylogReqDto } from '@data/domain/my-log/dto/req/patch-mylog.req.dto'
import { GetMylogsCalendarResDto } from '@data/domain/my-log/dto/res/get-mylogs-calendar.res.dto'
import { GetMylogsDateResDto } from '@data/domain/my-log/dto/res/get-mylogs-date.res.dto'
import { PatchMylogResDto } from '@data/domain/my-log/dto/res/patch-mylog.res.dto'
import { MyLogService } from '@data/domain/my-log/my-log.service'
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('마이로그')
@Auth({ type: 'user' })
@Controller('api/users/me/mylogs')
export class MylogsController {
  constructor(private readonly myLogService: MyLogService) {}

  @Get()
  @ApiOperation({
    summary: '월별 마이로그 캘린더',
    description:
      'completed DailyMissionItem 기준 날짜별 count (MyLog 유무 무관, backend-spec §7). ' +
      'cursor 없으면 현재 KST 월. 최신→과거 순. 더 과거 없으면 nextCursor=null.',
  })
  @ApiOkResponse({ type: GetMylogsCalendarResDto })
  async getCalendar(
    @User('id', ParseIntPipe) userId: number,
    @Query() query: GetMylogsCalendarReqDto,
  ): Promise<GetMylogsCalendarResDto> {
    return this.myLogService.getCalendar(userId, query)
  }

  @Get(':date')
  @ApiOperation({
    summary: '날짜별 완료 기록 목록',
    description:
      'completed item LEFT JOIN MyLog. myCompletedCount 는 ROW_NUMBER window 로 N+1 없이 산출 (§7). ' +
      ':date 형식은 YYYY-MM-DD (KST).',
  })
  @ApiParam({ name: 'date', description: 'YYYY-MM-DD (KST)' })
  @ApiOkResponse({ type: GetMylogsDateResDto })
  @ApiBadRequestResponse({ description: 'invalid_mylog_date' })
  async getRecordsByDate(
    @User('id', ParseIntPipe) userId: number,
    @Param('date') date: string,
  ): Promise<GetMylogsDateResDto> {
    return this.myLogService.getRecordsByDate(userId, date)
  }

  @Patch(':recordId')
  @ApiOperation({
    summary: '사진/메모 수정 (MyLog 없는 완료 기록엔 신규 create)',
    description:
      ':recordId = DailyMissionItem.id (backend-spec §4.4). ' +
      'photo: undefined=변경X / null=제거 / string=교체. memo: 동일 패턴 (최대 200자).',
  })
  @ApiParam({ name: 'recordId', description: 'DailyMissionItem.id' })
  @ApiOkResponse({ type: PatchMylogResDto })
  @ApiNotFoundResponse({
    description: 'not_found_mylog_record / mylog_record_not_completed',
  })
  @ApiBadRequestResponse({
    description: 'memo_too_long / invalid_mylog_photo',
  })
  async updateRecord(
    @User('id', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: PatchMylogReqDto,
  ): Promise<PatchMylogResDto> {
    return this.myLogService.updateRecord(userId, recordId, dto)
  }
}
