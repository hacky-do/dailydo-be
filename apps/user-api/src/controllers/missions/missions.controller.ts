import { Auth, Public, User } from '@data/decorators'
import { DailyMissionService } from '@data/domain/daily-mission/daily-mission.service'
import { CompleteMissionReqDto } from '@data/domain/daily-mission/dto/req/complete-mission.req.dto'
import { PostMissionsNewReqDto } from '@data/domain/daily-mission/dto/req/post-missions-new.req.dto'
import { GetMissionsResDto } from '@data/domain/daily-mission/dto/res/get-missions.res.dto'
import { GetNewMissionsResDto } from '@data/domain/daily-mission/dto/res/get-new-missions.res.dto'
import { PostMissionCompleteResDto } from '@data/domain/daily-mission/dto/res/post-mission-complete.res.dto'
import { PostMissionsNewResDto } from '@data/domain/daily-mission/dto/res/post-missions-new.res.dto'
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'

@ApiTags('오늘의 미션')
@Auth({ type: 'user' })
@Controller('api/missions')
export class MissionsController {
  constructor(private readonly dailyMissionService: DailyMissionService) {}

  @Public()
  @Get('new')
  @ApiOperation({
    summary: '미션 도착 — 무저장 후보 10개 노출',
    description:
      '회원은 dailySeed 로 deterministic 10개 (하루 1번), 이미 확정한 경우 status=CONFIRMED 만. 비회원은 isGuest:true + 고정 10개.',
  })
  @ApiOkResponse({ type: GetNewMissionsResDto })
  async getNew(@User('id') userId?: number): Promise<GetNewMissionsResDto> {
    return this.dailyMissionService.getNewMissions(userId ?? null)
  }

  @Post('new')
  @ApiOperation({ summary: '선택 확정 — 1~5개 missionId 확정' })
  @ApiOkResponse({ type: PostMissionsNewResDto })
  @ApiBadRequestResponse({
    description:
      'mission_selection_required / mission_selection_limit_exceeded / mission_not_in_current_batch',
  })
  @ApiConflictResponse({ description: 'mission_batch_already_confirmed' })
  async confirm(
    @User('id', ParseIntPipe) userId: number,
    @Body() dto: PostMissionsNewReqDto,
  ): Promise<PostMissionsNewResDto> {
    return this.dailyMissionService.confirmNewMissions(userId, dto.missionIds)
  }

  @Public()
  @Get()
  @ApiOperation({ summary: '선택 확정된 미션 목록 (완료여부 + 마이로그 + 카운터)' })
  @ApiOkResponse({ type: GetMissionsResDto })
  async getSelected(@User('id') userId?: number): Promise<GetMissionsResDto> {
    return this.dailyMissionService.getSelectedMissions(userId ?? null)
  }

  @Post(':itemId')
  @ApiOperation({
    summary: '미션 완료 (+ optional 마이로그)',
    description:
      '선택 확정된 item 을 완료 처리. 멱등(이미 완료된 item 재호출 → 200 + 현재 상태). ' +
      'mylog body 가 있으면 사진/메모 upsert. 본인 item 이 아니면 404.',
  })
  @ApiOkResponse({ type: PostMissionCompleteResDto })
  @ApiNotFoundResponse({
    description: 'not_found_mission_item (타인 item 포함 — 소유 leak 방지)',
  })
  @ApiBadRequestResponse({
    description: 'mission_item_not_selected / memo_too_long / invalid_mylog_photo',
  })
  async complete(
    @User('id', ParseIntPipe) userId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: CompleteMissionReqDto,
  ): Promise<PostMissionCompleteResDto> {
    return this.dailyMissionService.completeItem(userId, itemId, dto.mylog)
  }
}
