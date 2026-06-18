import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { EntityManager, DataSource } from 'typeorm'

import {
  CollectionItemResDto,
  CollectionRequirementResDto,
  GetCollectionsResDto
} from './dto/res/get-collections.res.dto'
import { FeaturedCollectionResDto } from './dto/res/featured-collection.res.dto'

interface CollectionListRow {
  collectionId: string
  title: string
  image: string | null
  description: string
  completed: boolean | string
  acquisitionRate: string | number | null
}

interface RequirementRow {
  collectionId: string
  missionId: string
  title: string
  count: string | number
}

interface FeaturedCollectionRow {
  id: string
  image: string | null
  description: string
  title: string
}

/** 미션 완료로 새로 해금된 컬렉션 (미션 완료 응답에 실린다). */
export interface UnlockedCollection {
  collectionId: string
  title: string
  image: string | null
  description: string
}

@Injectable()
export class CollectionService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async getCollections(userId: number): Promise<GetCollectionsResDto> {
    const rows = await this.dataSource.query<CollectionListRow[]>(
      `WITH total_users AS (SELECT COUNT(*)::numeric n FROM "User" WHERE "deletedAt" IS NULL),
         acquired AS (SELECT "collectionId", COUNT(*)::numeric n FROM "UserCollection" GROUP BY "collectionId")
       SELECT c."id"::text "collectionId",
         CASE WHEN c."type"='SPECIAL' AND uc."id" IS NULL THEN '???' ELSE c."title" END "title",
         c."imageUrl" "image", c."description", (uc."id" IS NOT NULL) "completed",
         ROUND(COALESCE(a.n,0)*100/NULLIF(t.n,0),1) "acquisitionRate"
       FROM "Collection" c CROSS JOIN total_users t
       LEFT JOIN acquired a ON a."collectionId"=c."id"
       LEFT JOIN "UserCollection" uc ON uc."userId"=$1 AND uc."collectionId"=c."id"
       WHERE c."isActive"=true ORDER BY c."sortOrder", c."id"`,
      [userId]
    )

    const collectionIds = rows.map((row) => row.collectionId)
    const requirementsByCollectionId = await this.getRequirementsByCollectionId(collectionIds)

    const collections: CollectionItemResDto[] = rows.map((row) => ({
      collectionId: row.collectionId,
      image: row.image ?? null,
      title: row.title,
      completed: row.completed === true || row.completed === 't',
      description: row.description,
      acquisitionRate: Number(row.acquisitionRate ?? 0),
      requirements: requirementsByCollectionId.get(row.collectionId) ?? []
    }))

    return new GetCollectionsResDto({ collections })
  }

  async getFeaturedCollection(userId: number): Promise<FeaturedCollectionResDto | null> {
    const row = await this.dataSource.query<FeaturedCollectionRow[]>(
      `SELECT c."id"::text "id",
         c."imageUrl" "image",
         c."description",
         c."title"
       FROM "UserCollection" uc
       INNER JOIN "Collection" c ON c."id" = uc."collectionId"
       WHERE uc."userId" = $1
         AND uc."isFeatured" = true
       LIMIT 1`,
      [userId]
    )

    if (!row[0]) return null

    return new FeaturedCollectionResDto({
      id: row[0].id,
      image: row[0].image ?? null,
      description: row[0].description,
      title: row[0].title
    })
  }

  async setFeatured(userId: number, collectionId: string): Promise<FeaturedCollectionResDto> {
    const id = this.parseCollectionId(collectionId)

    return this.dataSource.transaction(async (manager) => {
      // 획득 검증 먼저 — 미획득이면 throw → 롤백되어 기존 대표 유지
      const owned = await manager.query<{ exists: boolean }[]>(
        `SELECT true "exists" FROM "UserCollection"
         WHERE "userId" = $1 AND "collectionId" = $2 LIMIT 1`,
        [userId, id]
      )
      if (!owned[0]) {
        throw new ConflictException('collection_not_acquired')
      }

      // 기존 대표 해제 + 신규 대표 설정을 한 문장으로 → partial unique 중간 위반 회피
      await manager.query(
        `UPDATE "UserCollection"
         SET "isFeatured" = ("collectionId" = $2)
         WHERE "userId" = $1 AND ("isFeatured" = true OR "collectionId" = $2)`,
        [userId, id]
      )

      const row = await manager.query<FeaturedCollectionRow[]>(
        `SELECT c."id"::text "id", c."imageUrl" "image", c."description", c."title"
         FROM "Collection" c WHERE c."id" = $1`,
        [id]
      )
      return new FeaturedCollectionResDto({
        id: row[0].id,
        image: row[0].image ?? null,
        description: row[0].description,
        title: row[0].title
      })
    })
  }

  async deleteFeatured(userId: number, collectionId: string): Promise<void> {
    const id = this.parseCollectionId(collectionId)
    // 멱등: 이미 해제/미설정이어도 성공 (204)
    await this.dataSource.query(
      `UPDATE "UserCollection" SET "isFeatured" = false
       WHERE "userId" = $1 AND "collectionId" = $2 AND "isFeatured" = true`,
      [userId, id]
    )
  }

  async unlockEligible(manager: EntityManager, userId: number, missionId: number): Promise<UnlockedCollection[]> {
    // 방금 완료한 missionId 를 요구하는 컬렉션만 후보로, 모든 requirement 충족 시 해금.
    // 미션 완료 트랜잭션(manager) 안에서 실행 → 원자적. ON CONFLICT 로 멱등.
    // 새로 INSERT 된(=이번에 해금된) 컬렉션만 RETURNING → Collection 정보 붙여 반환.
    const rows = await manager.query<
      Array<{ collectionId: string; title: string; image: string | null; description: string }>
    >(
      `WITH candidate AS (
         SELECT DISTINCT "collectionId" FROM "CollectionRequirement" WHERE "missionId" = $2
       ),
       eligible AS (
         SELECT cr."collectionId"
         FROM "CollectionRequirement" cr
         JOIN candidate cand ON cand."collectionId" = cr."collectionId"
         JOIN "Collection" col ON col."id" = cr."collectionId" AND col."isActive" = true
         LEFT JOIN "UserMissionStat" ums
           ON ums."userId" = $1 AND ums."missionId" = cr."missionId"
         GROUP BY cr."collectionId"
         HAVING bool_and(COALESCE(ums."completedCount", 0) >= cr."requiredCount")
       ),
       ins AS (
         INSERT INTO "UserCollection" ("userId", "collectionId", "acquiredAt")
         SELECT $1, e."collectionId", now() FROM eligible e
         ON CONFLICT ("userId", "collectionId") DO NOTHING
         RETURNING "collectionId"
       )
       SELECT c."id"::text "collectionId", c."title", c."imageUrl" "image", c."description"
       FROM ins JOIN "Collection" c ON c."id" = ins."collectionId"`,
      [userId, missionId]
    )
    return rows.map((r) => ({
      collectionId: r.collectionId,
      title: r.title,
      image: r.image ?? null,
      description: r.description
    }))
  }

  private parseCollectionId(collectionId: string): number {
    const id = Number(collectionId)
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('invalid_collection_id')
    }
    return id
  }

  private async getRequirementsByCollectionId(
    collectionIds: string[]
  ): Promise<Map<string, CollectionRequirementResDto[]>> {
    const grouped = new Map<string, CollectionRequirementResDto[]>()
    if (collectionIds.length === 0) return grouped

    const rows = await this.dataSource.query<RequirementRow[]>(
      `SELECT cr."collectionId"::text "collectionId",
         cr."missionId"::text "missionId",
         m."title" "title",
         cr."requiredCount" "count"
       FROM "CollectionRequirement" cr
       INNER JOIN "Mission" m ON m."id" = cr."missionId"
       WHERE cr."collectionId" = ANY($1::bigint[])
       ORDER BY cr."collectionId", cr."sortOrder", cr."id"`,
      [collectionIds]
    )

    for (const row of rows) {
      const items = grouped.get(row.collectionId) ?? []
      items.push({
        missionId: Number(row.missionId),
        title: row.title,
        count: Number(row.count)
      })
      grouped.set(row.collectionId, items)
    }

    return grouped
  }
}
