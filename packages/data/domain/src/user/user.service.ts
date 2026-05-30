import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, In, Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { getMissionDate } from '../_shared/cycle'
import { DailyMission } from '../daily-mission/daily-mission.entity'
import { DailyMissionItem } from '../daily-mission/daily-mission-item.entity'
import { MissionCategory } from '../mission-category/mission-category.entity'
import { PatchUserReqDto } from './dto/req/patch-user.req.dto'
import { UserMissionCategory } from './entities/user-mission-category.entity'
import { UserSetting } from './entities/user-setting.entity'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async findOne(id: number) {
    const ret = await this.userRepository.findOne({ where: { id }, relations: { setting: true, accounts: true } })
    if (ret) {
      const [todayMissionCompletion, footprint, categories] = await Promise.all([
        this.getTodayMissionCompletion(id),
        this.getFootprint(id, ret.createdAt),
        this.getMyCategories(id)
      ])
      const { accounts, ...user } = ret
      const accountList = accounts.map((account) => account.type)
      return { ...user, id: Number(ret.id), accounts: accountList, todayMissionCompletion, footprint, categories }
    }
    throw new NotFoundException('not_found_user')
  }

  async update(id: number, options: PatchUserReqDto): Promise<{ id: number }> {
    const { agreeMarketing, name, profileImage, description, phone } = options
    const userPatch = { name, profileImage, description, phone }
    const definedUserPatch = Object.fromEntries(Object.entries(userPatch).filter(([, value]) => value !== undefined))

    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id } })
      if (!user) throw new NotFoundException('not_found_user')

      if (Object.keys(definedUserPatch).length > 0) {
        await manager.update(User, { id }, definedUserPatch)
      }
      if (agreeMarketing !== undefined) {
        await manager.update(UserSetting, { userId: id }, { agreeMarketing })
      }
    })
    return { id }
  }

  async findByEmailOrPhone(options: { email?: string; phone?: string }) {
    if (!options.email && !options.phone) throw new BadRequestException('email_or_phone_required')
    const query = this.userRepository.createQueryBuilder('u').innerJoinAndSelect('u.accounts', 'a')
    if (options.email) query.where('u.email = :email', { email: options.email })
    if (options.phone) query.where('u.phone = :phone', { phone: options.phone })
    return query.getOne()
  }

  private async getTodayMissionCompletion(userId: number) {
    const missionDate = getMissionDate(new Date())
    const row = await this.dataSource
      .getRepository(DailyMission)
      .createQueryBuilder('dm')
      .innerJoin(DailyMissionItem, 'item', 'item."dailyMissionId" = dm."id"')
      .where('dm."userId" = :userId', { userId })
      .andWhere('dm."missionDate" = :missionDate', { missionDate })
      .andWhere('item."isSelected" = true')
      .select('COUNT(item."id")::int', 'totalCount')
      .addSelect('COUNT(item."id") FILTER (WHERE item."isCompleted" = true)::int', 'completedCount')
      .getRawOne<{ totalCount: number; completedCount: number }>()

    const totalCount = row?.totalCount ?? 0
    const completedCount = row?.completedCount ?? 0
    return {
      totalCount,
      completedCount,
      completionRate: totalCount > 0 ? completedCount / totalCount : 0
    }
  }

  private async getFootprint(userId: number, createdAt: Date) {
    const completedDays = await this.dataSource
      .getRepository(DailyMission)
      .createQueryBuilder('dm')
      .innerJoin(DailyMissionItem, 'item', 'item."dailyMissionId" = dm."id"')
      .where('dm."userId" = :userId', { userId })
      .andWhere('item."isCompleted" = true')
      .select('DISTINCT dm."missionDate"', 'missionDate')
      .orderBy('dm."missionDate"', 'ASC')
      .getRawMany<{ missionDate: string | Date }>()

    const completedMissionCount = await this.dataSource
      .getRepository(DailyMissionItem)
      .createQueryBuilder('item')
      .innerJoin(DailyMission, 'dm', 'dm."id" = item."dailyMissionId"')
      .where('dm."userId" = :userId', { userId })
      .andWhere('item."isCompleted" = true')
      .getCount()

    const daysSinceSignup = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86_400_000))
    return {
      daysSinceSignup,
      maxConsecutiveUseDays: this.getMaxConsecutiveDays(completedDays.map((row) => row.missionDate)),
      completedMissionCount
    }
  }

  private async getMyCategories(userId: number) {
    const [userCategories, total] = await this.dataSource
      .getRepository(UserMissionCategory)
      .createQueryBuilder('uc')
      .where('uc."userId" = :userId', { userId })
      .orderBy('uc."sortOrder"', 'ASC')
      .addOrderBy('uc."id"', 'ASC')
      .getManyAndCount()

    const categoryIds = userCategories.map((userCategory) => userCategory.categoryId)
    const categories =
      categoryIds.length > 0
        ? await this.dataSource.getRepository(MissionCategory).find({
            where: { id: In(categoryIds) }
          })
        : []
    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]))
    const data = userCategories.map((userCategory) => ({
      id: Number(userCategory.id),
      categoryId: Number(userCategory.categoryId),
      name: categoryNameById.get(userCategory.categoryId),
      sortOrder: userCategory.sortOrder,
      createdAt: userCategory.createdAt,
      updatedAt: userCategory.updatedAt
    }))

    return { data, total }
  }

  private getMaxConsecutiveDays(missionDates: Array<string | Date>) {
    let max = 0
    let current = 0
    let previous: number | null = null

    for (const missionDate of missionDates) {
      const date = missionDate instanceof Date ? missionDate.toISOString().slice(0, 10) : missionDate
      const dateTime = new Date(`${date}T00:00:00+09:00`).getTime()
      if (previous === null || dateTime - previous === 86_400_000) {
        current += 1
      } else {
        current = 1
      }
      if (current > max) max = current
      previous = dateTime
    }

    return max
  }
}
