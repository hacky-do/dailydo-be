import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'

import { sampleCandidates as sampleFromCycle } from '../_shared/cycle'
import { Mission } from './mission.entity'

@Injectable()
export class MissionService {
  constructor(
    @InjectRepository(Mission) private readonly missionRepo: Repository<Mission>,
  ) {}

  async getActiveMissionPool(): Promise<Mission[]> {
    return this.missionRepo.find({ where: { isActive: true } })
  }

  sampleCandidates(seed: number, pool: Mission[]): Mission[] {
    return sampleFromCycle(seed, pool)
  }

  async incrementCompletedCount(manager: EntityManager, missionId: number): Promise<void> {
    await manager.query(
      `UPDATE "Mission" SET "totalCompletedCount" = "totalCompletedCount" + 1 WHERE "id" = $1`,
      [missionId],
    )
  }

  async decrementCompletedCount(manager: EntityManager, missionId: number): Promise<void> {
    await manager.query(
      `UPDATE "Mission" SET "totalCompletedCount" = GREATEST("totalCompletedCount" - 1, 0) WHERE "id" = $1`,
      [missionId],
    )
  }
}
