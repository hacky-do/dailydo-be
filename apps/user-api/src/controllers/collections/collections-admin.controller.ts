// ⚠️ 무인증 운영 데이터 주입용 컨트롤러 — prod 노출 금지.
// 일회성 seed 작업 후 이 파일 + collections-http.module 등록 한 줄을 제거할 것.
import { Public } from '@data/decorators'
import {
  BackfillResDto,
  CollectionService,
  CreateCollectionReqDto,
  CreateCollectionResDto,
  ListMissionsResDto,
  SaveRequirementsReqDto,
  SaveRequirementsResDto
} from '@data/domain/collection'
import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('컬렉션 운영 주입 (무인증 — prod 금지)')
@Controller('api/collections')
export class CollectionsAdminController {
  constructor(private readonly collectionService: CollectionService) {}

  @Public()
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: '컬렉션 생성' })
  @ApiOkResponse({ type: CreateCollectionResDto })
  async createCollection(@Body() dto: CreateCollectionReqDto): Promise<CreateCollectionResDto> {
    return new CreateCollectionResDto(await this.collectionService.createCollection(dto))
  }

  @Public()
  @Get('missions')
  @ApiOperation({ summary: '전체 미션 조회 (매핑용 — id 확인)' })
  @ApiOkResponse({ type: ListMissionsResDto })
  async listMissions(): Promise<ListMissionsResDto> {
    return new ListMissionsResDto({ missions: await this.collectionService.listAllMissions() })
  }

  @Public()
  @Post(':collectionId/requirements')
  @HttpCode(200)
  @ApiOperation({ summary: '획득 조건 매핑 저장 (컬렉션 1 : 미션 N, 멱등)' })
  @ApiOkResponse({ type: SaveRequirementsResDto })
  async saveRequirements(
    @Param('collectionId') collectionId: string,
    @Body() dto: SaveRequirementsReqDto
  ): Promise<SaveRequirementsResDto> {
    return new SaveRequirementsResDto(await this.collectionService.saveRequirements(collectionId, dto.requirements))
  }

  @Public()
  @Post('backfill-event-unlock')
  @HttpCode(200)
  @ApiOperation({ summary: '기존 유저에게 이벤트성 보상(가입/첫완료) 소급 해금 (일회성, 멱등)' })
  @ApiOkResponse({ type: BackfillResDto })
  async backfillEvent(): Promise<BackfillResDto> {
    return new BackfillResDto(await this.collectionService.backfillEventUnlock())
  }
}
