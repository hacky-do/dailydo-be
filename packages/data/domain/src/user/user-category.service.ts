import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { MissionCategory } from '../mission-category/mission-category.entity'
import { GetUserCategoriesReqDto } from './dto/req/get-user-categories.req.dto'
import { GetUserCategoriesResDto } from './dto/res/get-user-category.res.dto'
import { UserMissionCategory } from './entities/user-mission-category.entity'

@Injectable()
export class UserCategoryService {
  constructor(
    @InjectRepository(MissionCategory)
    private readonly categoryRepo: Repository<MissionCategory>,
    @InjectRepository(UserMissionCategory)
    private readonly userCategoryRepo: Repository<UserMissionCategory>
  ) {}

  async getMyCategories(userId: number, options: GetUserCategoriesReqDto): Promise<GetUserCategoriesResDto> {
    const query = this.userCategoryRepo.createQueryBuilder('uc').where('uc."userId" = :userId', { userId })

    if (options.sort && options.order) {
      query.orderBy(`uc.${options.sort}`, options.order)
    } else {
      query.orderBy('uc.sortOrder', 'ASC')
    }
    query.addOrderBy('uc.id', 'ASC')

    const [userCategories, total] = await query.skip(options.start).take(options.perPage).getManyAndCount()

    const categoryIds = userCategories.map((userCategory) => userCategory.categoryId)
    const categories =
      categoryIds.length > 0
        ? await this.categoryRepo.find({
            where: { id: In(categoryIds) }
          })
        : []
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const data = userCategories.map((userCategory) => ({
      id: Number(userCategory.id),
      categoryId: Number(userCategory.categoryId),
      name: categoryById.get(userCategory.categoryId)?.name,
      image: categoryById.get(userCategory.categoryId)?.image,
      sortOrder: userCategory.sortOrder,
      createdAt: userCategory.createdAt,
      updatedAt: userCategory.updatedAt
    }))

    return { data, total }
  }

  async updateMyCategories(userId: number, categoryIds: number[]) {
    const uniqueIds = [...new Set(categoryIds.map(Number))]

    // 각 categoryId를 DB로 검증 → 유효하지 않으면 400
    const categories = await this.categoryRepo.find({ where: { id: In(uniqueIds) } })
    const validIds = new Set(categories.map((category) => Number(category.id)))
    const invalidIds = uniqueIds.filter((id) => !validIds.has(id))
    if (invalidIds.length > 0) {
      throw new BadRequestException(`invalid_category: ${invalidIds.join(',')}`)
    }

    // 사용자의 미션 카테고리 집합을 categoryIds로 전체 교체 (배열 순서 = sortOrder)
    await this.userCategoryRepo.manager.transaction(async (manager) => {
      const existing = await manager.find(UserMissionCategory, { where: { userId } })
      const existingByCategoryId = new Map(existing.map((uc) => [Number(uc.categoryId), uc]))
      const desired = new Set(uniqueIds)

      const toDelete = existing.filter((uc) => !desired.has(Number(uc.categoryId)))
      if (toDelete.length > 0) {
        await manager.delete(UserMissionCategory, { id: In(toDelete.map((uc) => uc.id)) })
      }

      const rows = uniqueIds.map((categoryId, index) => {
        const found = existingByCategoryId.get(categoryId)
        if (found) {
          found.sortOrder = index
          return found
        }
        return new UserMissionCategory({ userId, categoryId, sortOrder: index })
      })
      await manager.save(UserMissionCategory, rows)
    })

    return { categoryIds: uniqueIds }
  }

  async deleteMyCategory(userId: number, id: number) {
    const result = await this.userCategoryRepo.delete({ id, userId })
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('not_found_user_category')
    }
  }
}
