import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
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

  async createMyCategory(userId: number, options: { categoryId: number; sortOrder?: number }) {
    await this.assertCategoryExists(options.categoryId)
    try {
      const userCategory = new UserMissionCategory({
        userId,
        categoryId: options.categoryId,
        sortOrder: options.sortOrder ?? 0
      })
      const saved = await this.userCategoryRepo.save(userCategory)
      return { id: Number(saved.id) }
    } catch (e) {
      if (e.code === '23505' || e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('duplicate_category')
      }
      throw e
    }
  }

  async updateMyCategory(userId: number, id: number, options: { categoryId?: number; sortOrder?: number }) {
    const existingUserCategory = await this.userCategoryRepo.findOne({ where: { id, userId } })
    if (!existingUserCategory) throw new NotFoundException('not_found_user_category')

    if (options.categoryId !== undefined) {
      await this.assertCategoryExists(options.categoryId)
    }

    if (options.categoryId !== undefined) {
      existingUserCategory.categoryId = options.categoryId
    }
    if (options.sortOrder !== undefined) {
      existingUserCategory.sortOrder = options.sortOrder
    }

    try {
      const saved = await this.userCategoryRepo.save(existingUserCategory)
      return { id: Number(saved.id) }
    } catch (e) {
      if (e.code === '23505' || e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('duplicate_category')
      }
      throw e
    }
  }

  async deleteMyCategory(userId: number, id: number) {
    const result = await this.userCategoryRepo.delete({ id, userId })
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('not_found_user_category')
    }
  }

  private async assertCategoryExists(categoryId: number) {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } })
    if (!category) throw new NotFoundException('not_found_category')
  }
}
