import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { DataSource, EntityManager, Repository } from 'typeorm'

import { getMissionDate, MEMO_MAX_LENGTH } from '../_shared/cycle'

dayjs.extend(customParseFormat)
import { DailyMissionItem } from '../daily-mission/daily-mission-item.entity'
import { DailyMission } from '../daily-mission/daily-mission.entity'
import { GetMylogsCalendarReqDto } from './dto/req/get-mylogs-calendar.req.dto'
import { PatchMylogReqDto } from './dto/req/patch-mylog.req.dto'
import {
  CalendarDayDto,
  CalendarMonthDto,
  GetMylogsCalendarResDto,
} from './dto/res/get-mylogs-calendar.res.dto'
import { GetMylogsDateResDto, MylogDateRecordDto } from './dto/res/get-mylogs-date.res.dto'
import { PatchMylogResDto } from './dto/res/patch-mylog.res.dto'
import { MyLog } from './my-log.entity'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DEFAULT_CALENDAR_LIMIT = 5

@Injectable()
export class MyLogService {
  constructor(
    @InjectRepository(MyLog)
    private readonly myLogRepo: Repository<MyLog>,
    @InjectRepository(DailyMissionItem)
    private readonly itemRepo: Repository<DailyMissionItem>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getCalendar(
    userId: number,
    query: GetMylogsCalendarReqDto,
  ): Promise<GetMylogsCalendarResDto> {
    const limit = query.limit ?? DEFAULT_CALENDAR_LIMIT
    const startMonth =
      query.cursor ?? getMissionDate(new Date()).slice(0, 7)

    const rows = await this.dataSource.query<
      { date: string; count: string }[]
    >(
      `
      SELECT
        to_char(dm."missionDate", 'YYYY-MM-DD') AS "date",
        COUNT(*)::text                          AS "count"
      FROM "DailyMissionItem" dmi
      JOIN "DailyMission" dm
        ON dm."id" = dmi."dailyMissionId"
       AND dm."userId" = $1
      WHERE dmi."isCompleted" = true
        AND to_char(dm."missionDate", 'YYYY-MM') <= $2
      GROUP BY to_char(dm."missionDate", 'YYYY-MM-DD')
      ORDER BY "date" DESC
      `,
      [userId, startMonth],
    )

    return this.toCalendarResponse(rows, limit)
  }

  private toCalendarResponse(
    rows: { date: string; count: string }[],
    limit: number,
  ): GetMylogsCalendarResDto {
    const groups: Record<string, CalendarDayDto[]> = {}
    const monthOrder: string[] = []
    for (const r of rows) {
      const ym = r.date.slice(0, 7)
      if (!groups[ym]) {
        groups[ym] = []
        monthOrder.push(ym)
      }
      groups[ym].push({ date: r.date, count: Number(r.count) })
    }

    const takenMonths = monthOrder.slice(0, limit)
    const records: CalendarMonthDto[] = takenMonths.map((ym) => {
      const [yearStr, monthStr] = ym.split('-')
      return {
        year: Number(yearStr),
        month: Number(monthStr),
        logs: groups[ym],
      }
    })

    const nextCursor = monthOrder[limit] ?? null

    return new GetMylogsCalendarResDto({ records, nextCursor })
  }

  async getRecordsByDate(userId: number, date: string): Promise<GetMylogsDateResDto> {
    if (!DATE_REGEX.test(date) || !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException('invalid_mylog_date')
    }

    type RawRow = {
      id: string
      categoryId: string
      categoryName: string
      title: string
      completedCount: string
      createdAt: string
      photo: string | null
      memo: string | null
    }

    const raw = await this.dataSource.query<RawRow[]>(
      `
      WITH user_completed AS (
        SELECT
          dmi."id"             AS "id",
          dmi."missionId"      AS "missionId",
          dmi."dailyMissionId" AS "dailyMissionId",
          dmi."completedAt"    AS "completedAt",
          dm."missionDate"     AS "missionDate",
          ROW_NUMBER() OVER (
            PARTITION BY dmi."missionId"
            ORDER BY dmi."completedAt", dmi."id"
          ) AS "rn"
        FROM "DailyMissionItem" dmi
        JOIN "DailyMission" dm
          ON dm."id" = dmi."dailyMissionId"
         AND dm."userId" = $1
        WHERE dmi."isCompleted" = true
      )
      SELECT
        uc."id"::text          AS "id",
        m."categoryId"::text   AS "categoryId",
        mc."name"              AS "categoryName",
        m."title"              AS "title",
        uc."rn"::text          AS "completedCount",
        to_char(uc."completedAt" AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS') || '+09:00' AS "createdAt",
        ml."photoUrl"          AS "photo",
        ml."memo"              AS "memo"
      FROM user_completed uc
      JOIN "Mission" m            ON m."id" = uc."missionId"
      LEFT JOIN "MissionCategory" mc ON mc."id" = m."categoryId"
      LEFT JOIN "MyLog" ml
        ON ml."dailyMissionItemId" = uc."id"
       AND ml."deletedAt" IS NULL
      WHERE to_char(uc."missionDate", 'YYYY-MM-DD') = $2
      ORDER BY uc."completedAt" ASC, uc."id" ASC
      `,
      [userId, date],
    )

    const records: MylogDateRecordDto[] = raw.map((r) => ({
      id: r.id,
      categoryId: Number(r.categoryId),
      categoryName: r.categoryName ?? '',
      completedCount: Number(r.completedCount),
      title: r.title,
      photo: r.photo ?? null,
      createdAt: r.createdAt,
      memo: r.memo ?? null,
    }))

    return new GetMylogsDateResDto({ records })
  }

  async updateRecord(
    userId: number,
    recordId: number,
    dto: PatchMylogReqDto,
  ): Promise<PatchMylogResDto> {
    if (dto.memo != null && dto.memo.length > MEMO_MAX_LENGTH) {
      throw new BadRequestException('memo_too_long')
    }

    if (dto.photo != null) {
      this.assertOwnedPhoto(userId, dto.photo)
    }

    const qr = this.dataSource.createQueryRunner()
    await qr.connect()
    await qr.startTransaction()
    try {
      const item = await this.loadOwnedCompletedItem(qr.manager, userId, recordId)
      const existing = await qr.manager.findOne(MyLog, {
        where: { dailyMissionItemId: recordId },
      })

      let saved: MyLog
      if (existing) {
        const patch: Partial<{ photoUrl: string | null; memo: string | null }> = {}

        if (dto.photo !== undefined) patch.photoUrl = dto.photo
        if (dto.memo !== undefined) patch.memo = dto.memo
        if (Object.keys(patch).length > 0) {
          await qr.manager.update(
            MyLog,
            { id: existing.id },
            patch as Partial<MyLog>,
          )
        }
        saved = await qr.manager.findOneOrFail(MyLog, {
          where: { id: existing.id },
        })
      } else {
        saved = await qr.manager.save(
          qr.manager.create(MyLog, {
            userId,
            dailyMissionId: item.dailyMissionId,
            dailyMissionItemId: recordId,
            missionId: item.missionId,
            photoUrl: dto.photo ?? undefined,
            memo: dto.memo ?? undefined,
            logDate: item.missionDate,
            isShared: false,
          }),
        )
      }

      await qr.commitTransaction()
      return new PatchMylogResDto({
        id: String(saved.id),
        photo: saved.photoUrl ?? null,
        memo: saved.memo ?? null,
      })
    } catch (e) {
      if (qr.isTransactionActive) await qr.rollbackTransaction()
      throw e
    } finally {
      await qr.release()
    }
  }

  private async loadOwnedCompletedItem(
    manager: EntityManager,
    userId: number,
    recordId: number,
  ): Promise<{
    id: number
    dailyMissionId: number
    missionId: number
    isCompleted: boolean
    missionDate: string
  }> {
    const row = await manager
      .createQueryBuilder(DailyMissionItem, 'item')
      .innerJoin(DailyMission, 'dm', 'dm."id" = item."dailyMissionId"')
      .where('item."id" = :recordId', { recordId })
      .andWhere('dm."userId" = :userId', { userId })
      .select([
        'item."id" AS "id"',
        'item."dailyMissionId" AS "dailyMissionId"',
        'item."missionId" AS "missionId"',
        'item."isCompleted" AS "isCompleted"',
        'dm."missionDate" AS "missionDate"',
      ])
      .getRawOne<{
        id: string
        dailyMissionId: string
        missionId: string
        isCompleted: boolean
        missionDate: string
      }>()

    if (!row) throw new NotFoundException('not_found_mylog_record')
    if (!row.isCompleted) throw new NotFoundException('mylog_record_not_completed')

    return {
      id: Number(row.id),
      dailyMissionId: Number(row.dailyMissionId),
      missionId: Number(row.missionId),
      isCompleted: row.isCompleted,
      missionDate: row.missionDate,
    }
  }

  private assertOwnedPhoto(_userId: number, photo: string): void {
    if (!/^https?:\/\//.test(photo)) {
      throw new BadRequestException('invalid_mylog_photo')
    }
  }
}
