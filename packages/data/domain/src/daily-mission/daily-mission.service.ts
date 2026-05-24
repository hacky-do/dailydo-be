import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, EntityManager, Repository } from 'typeorm'

import {
  DailyMissionStatus,
  dailySeed,
  getMissionDate,
  MAX_SELECTABLE,
  MEMO_MAX_LENGTH,
  MIN_SELECTABLE,
  MissionType,
} from '../_shared/cycle'
import { MissionCategory } from '../mission-category/mission-category.entity'
import { Mission } from '../mission/mission.entity'
import { MissionService } from '../mission/mission.service'
import { UserMissionStat } from '../mission/user-mission-stat.entity'
import { MyLog } from '../my-log/my-log.entity'
import { CompleteMissionMyLogDto } from './dto/req/complete-mission.req.dto'
import { GetMissionsResDto, SelectedMissionItemDto } from './dto/res/get-missions.res.dto'
import { GetNewMissionsResDto, NewMissionCandidateDto } from './dto/res/get-new-missions.res.dto'
import { PostMissionCompleteResDto } from './dto/res/post-mission-complete.res.dto'
import { ConfirmedItemDto, PostMissionsNewResDto } from './dto/res/post-missions-new.res.dto'
import { DailyMissionItem } from './daily-mission-item.entity'
import { DailyMission } from './daily-mission.entity'

@Injectable()
export class DailyMissionService {
  constructor(
    @InjectRepository(DailyMission)
    private readonly dailyMissionRepo: Repository<DailyMission>,
    @InjectRepository(DailyMissionItem)
    private readonly dailyMissionItemRepo: Repository<DailyMissionItem>,
    @InjectRepository(MissionCategory)
    private readonly categoryRepo: Repository<MissionCategory>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly missionService: MissionService,
  ) {}

  async getNewMissions(userId: number | null): Promise<GetNewMissionsResDto> {
    const missionDate = getMissionDate(new Date())

    if (userId !== null) {
      const confirmed = await this.dailyMissionRepo.findOne({
        where: {
          userId,
          missionDate,
          status: DailyMissionStatus.CONFIRMED,
        },
      })

      if (confirmed) {
        return new GetNewMissionsResDto({
          status: DailyMissionStatus.CONFIRMED,
          missionDate,
          items: [],
          minSelectableCount: MIN_SELECTABLE,
          maxSelectableCount: MAX_SELECTABLE,
          isGuest: false,
        })
      }
    }

    const pool = await this.missionService.getActiveMissionPool()
    const seed = dailySeed(userId, missionDate)
    const candidates = this.missionService.sampleCandidates(seed, pool)
    const categories = await this.categoryRepo.find()
    const categoryNameById = new Map<number, string>(
      categories.map((c) => [Number(c.id), c.name]),
    )

    const items: NewMissionCandidateDto[] = candidates.map((m) => ({
      missionId: Number(m.id),
      title: m.title,
      description: m.description ?? null,
      categoryId: Number(m.categoryId),
      categoryName: categoryNameById.get(Number(m.categoryId)) ?? null,
      image: m.imageUrl ?? null,
      totalCompletedCount: Number(m.totalCompletedCount),
      isSpecial: m.type === MissionType.SPECIAL,
    }))

    return new GetNewMissionsResDto({
      status: userId !== null ? DailyMissionStatus.ARRIVED : null,
      missionDate: userId !== null ? missionDate : null,
      items,
      minSelectableCount: MIN_SELECTABLE,
      maxSelectableCount: MAX_SELECTABLE,
      isGuest: userId === null,
    })
  }

  async confirmNewMissions(
    userId: number,
    missionIds: number[],
  ): Promise<PostMissionsNewResDto> {
    if (missionIds.length < MIN_SELECTABLE) {
      throw new BadRequestException('mission_selection_required')
    }

    if (missionIds.length > MAX_SELECTABLE) {
      throw new BadRequestException('mission_selection_limit_exceeded')
    }

    if (new Set(missionIds).size !== missionIds.length) {
      throw new BadRequestException('mission_selection_required')
    }

    const missionDate = getMissionDate(new Date())
    const pool = await this.missionService.getActiveMissionPool()
    const candidates = this.missionService.sampleCandidates(
      dailySeed(userId, missionDate),
      pool,
    )
    const candidateById = new Map<number, Mission>(
      candidates.map((m) => [Number(m.id), m]),
    )

    if (!missionIds.every((id) => candidateById.has(id))) {
      throw new BadRequestException('mission_not_in_current_batch')
    }

    const now = new Date()
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()
    try {
      const insertResult = await qr.manager.query(
        `INSERT INTO "DailyMission"
           ("userId","missionDate","status","arrivedAt","confirmedAt")
         VALUES ($1,$2,'CONFIRMED',$3,$4)
         ON CONFLICT ("userId","missionDate") DO NOTHING
         RETURNING "id"`,
        [userId, missionDate, now, now],
      )

      if (insertResult.length === 0) {
        const existing = await qr.manager.findOneOrFail(DailyMission, {
          where: { userId, missionDate },
        })
        const existingItems = await qr.manager.find(DailyMissionItem, {
          where: { dailyMissionId: existing.id, isSelected: true },
        })
        const existingIds = existingItems
          .map((i) => Number(i.missionId))
          .sort((a, b) => a - b)
        const requested = [...missionIds].sort((a, b) => a - b)
        const same =
          existingIds.length === requested.length &&
          existingIds.every((id, i) => id === requested[i])

        await qr.rollbackTransaction()

        if (!same) {
          throw new ConflictException('mission_batch_already_confirmed')
        }

        return this.toConfirmResDto(existing, existingItems, candidateById)
      }

      const batchId = Number(insertResult[0].id)
      const items: DailyMissionItem[] = []
      for (const missionId of missionIds) {
        const saved = await qr.manager.save(
          qr.manager.create(DailyMissionItem, {
            dailyMissionId: batchId,
            missionId,
            isSelected: true,
            selectedAt: now,
            isCompleted: false,
          }),
        )
        items.push(saved)
      }

      await qr.commitTransaction()

      const batch = await this.dailyMissionRepo.findOneByOrFail({ id: batchId })

      return this.toConfirmResDto(batch, items, candidateById)
    } catch (e) {
      if (qr.isTransactionActive) await qr.rollbackTransaction()
      throw e
    } finally {
      await qr.release()
    }
  }

  private toConfirmResDto(
    batch: DailyMission,
    items: DailyMissionItem[],
    candidateById: Map<number, Mission>,
  ): PostMissionsNewResDto {
    const itemDtos: ConfirmedItemDto[] = items.map((it) => ({
      itemId: Number(it.id),
      missionId: Number(it.missionId),
      title: candidateById.get(Number(it.missionId))?.title ?? '',
      isSelected: it.isSelected,
    }))
    return new PostMissionsNewResDto({
      batchId: Number(batch.id),
      status: batch.status,
      confirmedAt: batch.confirmedAt ?? batch.arrivedAt,
      selectedCount: items.length,
      items: itemDtos,
    })
  }

  async getSelectedMissions(userId: number | null): Promise<GetMissionsResDto> {
    if (userId === null) {
      return new GetMissionsResDto({ isGuest: true, items: [] })
    }

    const missionDate = getMissionDate(new Date())
    const rows = await this.dailyMissionItemRepo
      .createQueryBuilder('item')
      .innerJoin(DailyMission, 'dm', 'dm."id" = item."dailyMissionId"')
      .innerJoin(Mission, 'm', 'm."id" = item."missionId"')
      .leftJoin(MissionCategory, 'cat', 'cat."id" = m."categoryId"')
      .leftJoin(
        MyLog,
        'log',
        'log."dailyMissionItemId" = item."id" AND log."deletedAt" IS NULL',
      )
      .leftJoin(
        UserMissionStat,
        'ums',
        'ums."userId" = dm."userId" AND ums."missionId" = item."missionId"',
      )
      .where('dm."userId" = :userId', { userId })
      .andWhere('dm."missionDate" = :missionDate', { missionDate })
      .andWhere('item."isSelected" = true')
      .select([
        'item."id" AS "itemId"',
        'item."missionId" AS "missionId"',
        'item."isCompleted" AS "completed"',
        'item."completedAt" AS "completedAt"',
        'm."title" AS "title"',
        'm."imageUrl" AS "image"',
        'm."categoryId" AS "categoryId"',
        'cat."name" AS "categoryName"',
        'm."totalCompletedCount" AS "totalCompletedCount"',
        'COALESCE(ums."completedCount", 0) AS "myCompletedCount"',
        'log."id" AS "mylogId"',
        'log."photoUrl" AS "mylogPhoto"',
        'log."memo" AS "mylogMemo"',
      ])
      .orderBy('item."id"', 'ASC')
      .getRawMany()

    const items: SelectedMissionItemDto[] = rows.map((r) => ({
      itemId: Number(r.itemId),
      missionId: Number(r.missionId),
      title: r.title,
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName ?? null,
      image: r.image ?? null,
      totalCompletedCount: Number(r.totalCompletedCount),
      myCompletedCount: Number(r.myCompletedCount),
      completed: r.completed === true || r.completed === 't',
      completedAt: r.completedAt ?? null,
      mylog: r.mylogId
        ? {
            id: Number(r.mylogId),
            photo: r.mylogPhoto ?? null,
            memo: r.mylogMemo ?? null,
          }
        : null,
    }))

    return new GetMissionsResDto({ isGuest: false, items })
  }

  async completeItem(
    userId: number,
    itemId: number,
    mylog?: CompleteMissionMyLogDto,
  ): Promise<PostMissionCompleteResDto> {
    if (mylog?.memo && mylog.memo.length > MEMO_MAX_LENGTH) {
      throw new BadRequestException('memo_too_long')
    }
    if (mylog?.photo) {
      this.assertOwnedPhoto(userId, mylog.photo)
    }

    const now = new Date()
    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()
    try {
      const item = await this.loadOwnedItem(qr.manager, userId, itemId)
      if (!item.isSelected) {
        throw new BadRequestException('mission_item_not_selected')
      }

      const update = await qr.manager.update(
        DailyMissionItem,
        { id: itemId, isCompleted: false },
        { isCompleted: true, completedAt: now },
      )
      const justCompleted = (update.affected ?? 0) > 0

      if (justCompleted) {
        await this.missionService.incrementCompletedCount(qr.manager, item.missionId)
        await qr.manager.query(
          `INSERT INTO "UserMissionStat"
             ("userId","missionId","completedCount","lastCompletedAt","updatedAt")
           VALUES ($1, $2, 1, $3, now())
           ON CONFLICT ("userId","missionId") DO UPDATE
             SET "completedCount" = "UserMissionStat"."completedCount" + 1,
                 "lastCompletedAt" = EXCLUDED."lastCompletedAt",
                 "updatedAt" = now()`,
          [userId, item.missionId, now],
        )
      }

      let savedLog: MyLog | null = null
      if (mylog && (mylog.photo !== undefined || mylog.memo !== undefined)) {
        savedLog = await this.upsertMyLog(qr.manager, {
          userId,
          item,
          logDate: item.missionDate,
          mylog,
        })
      } else {
        savedLog = await qr.manager.findOne(MyLog, {
          where: { dailyMissionItemId: itemId },
        })
      }

      await qr.commitTransaction()
      return this.toCompleteResDto(qr.manager, userId, item, savedLog)
    } catch (e) {
      if (qr.isTransactionActive) await qr.rollbackTransaction()
      throw e
    } finally {
      await qr.release()
    }
  }

  private async loadOwnedItem(
    manager: EntityManager,
    userId: number,
    itemId: number,
  ): Promise<{
    id: number
    dailyMissionId: number
    missionId: number
    isSelected: boolean
    isCompleted: boolean
    missionDate: string
  }> {
    const row = await manager
      .createQueryBuilder(DailyMissionItem, 'item')
      .innerJoin(DailyMission, 'dm', 'dm."id" = item."dailyMissionId"')
      .where('item."id" = :itemId', { itemId })
      .andWhere('dm."userId" = :userId', { userId })
      .select([
        'item."id" AS "id"',
        'item."dailyMissionId" AS "dailyMissionId"',
        'item."missionId" AS "missionId"',
        'item."isSelected" AS "isSelected"',
        'item."isCompleted" AS "isCompleted"',
        'dm."missionDate" AS "missionDate"',
      ])
      .getRawOne<{
        id: string
        dailyMissionId: string
        missionId: string
        isSelected: boolean
        isCompleted: boolean
        missionDate: string
      }>()

    if (!row) throw new NotFoundException('not_found_mission_item')
    return {
      id: Number(row.id),
      dailyMissionId: Number(row.dailyMissionId),
      missionId: Number(row.missionId),
      isSelected: row.isSelected,
      isCompleted: row.isCompleted,
      missionDate: row.missionDate,
    }
  }

  private assertOwnedPhoto(_userId: number, photo: string): void {
    if (!/^https?:\/\//.test(photo)) {
      throw new BadRequestException('invalid_mylog_photo')
    }
  }

  private async upsertMyLog(
    manager: EntityManager,
    params: {
      userId: number
      item: { id: number; dailyMissionId: number; missionId: number; missionDate: string }
      logDate: string
      mylog: CompleteMissionMyLogDto
    },
  ): Promise<MyLog> {
    const { userId, item, logDate, mylog } = params
    const existing = await manager.findOne(MyLog, {
      where: { dailyMissionItemId: item.id },
    })

    if (existing) {
      if (mylog.photo !== undefined) existing.photoUrl = mylog.photo
      if (mylog.memo !== undefined) existing.memo = mylog.memo
      return await manager.save(existing)
    }

    return await manager.save(
      manager.create(MyLog, {
        userId,
        dailyMissionId: item.dailyMissionId,
        dailyMissionItemId: item.id,
        missionId: item.missionId,
        photoUrl: mylog.photo,
        memo: mylog.memo,
        logDate,
        isShared: false,
      }),
    )
  }

  private async toCompleteResDto(
    manager: EntityManager,
    userId: number,
    item: { id: number; missionId: number },
    mylog: MyLog | null,
  ): Promise<PostMissionCompleteResDto> {
    const row = await manager
      .createQueryBuilder(DailyMissionItem, 'item')
      .innerJoin(Mission, 'm', 'm."id" = item."missionId"')
      .leftJoin(
        UserMissionStat,
        'ums',
        'ums."userId" = :userId AND ums."missionId" = item."missionId"',
        { userId },
      )
      .where('item."id" = :itemId', { itemId: item.id })
      .select([
        'item."isCompleted" AS "completed"',
        'item."completedAt" AS "completedAt"',
        'm."totalCompletedCount" AS "totalCompletedCount"',
        'COALESCE(ums."completedCount", 0) AS "myCompletedCount"',
      ])
      .getRawOne<{
        completed: boolean
        completedAt: Date | null
        totalCompletedCount: string
        myCompletedCount: string
      }>()

    return new PostMissionCompleteResDto({
      itemId: item.id,
      completed: row?.completed ?? true,
      completedAt: row?.completedAt ?? null,
      totalCompletedCount: Number(row?.totalCompletedCount ?? 0),
      myCompletedCount: Number(row?.myCompletedCount ?? 0),
      mylog: mylog
        ? {
            id: Number(mylog.id),
            photo: mylog.photoUrl ?? null,
            memo: mylog.memo ?? null,
          }
        : null,
    })
  }
}
