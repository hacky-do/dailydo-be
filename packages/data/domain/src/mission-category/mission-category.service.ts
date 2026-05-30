import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MissionCategory } from './mission-category.entity'
import { GetMissionCategoriesResDto, MissionCategoryItemDto } from './dto/res/get-mission-category.res.dto'
import { PostMissionCategoryReqDto } from './dto/req/post-mission-category.req.dto'
import { PatchMissionCategoryReqDto } from './dto/req/patch-mission-category.req.dto'
import { PostMissionCategoryResDto } from './dto/res/post-mission-category.res.dto'
import { GetMissionCategoriesReqDto } from './dto/req/get-mission-categories.req.dto'

@Injectable()
export class MissionCategoryService {
  constructor(
    @InjectRepository(MissionCategory)
    private readonly missionCategoryRepo: Repository<MissionCategory>
  ) {}

  async findAll(options: GetMissionCategoriesReqDto): Promise<GetMissionCategoriesResDto> {
    const query = this.missionCategoryRepo.createQueryBuilder('mc').select(['mc.id', 'mc.name'])

    if (options.sort && options.order) {
      query.orderBy(`mc.${options.sort}`, options.order)
    } else {
      query.orderBy('mc.name', 'ASC')
    }

    const [categories, total] = await query.skip(options.start).take(options.perPage).getManyAndCount()
    const data = categories.map((category) => ({
      id: Number(category.id),
      name: category.name
    }))

    return { data, total }
  }

  async findOne(id: number): Promise<MissionCategoryItemDto> {
    const data = await this.missionCategoryRepo
      .createQueryBuilder('mc')
      .select(['mc.id', 'mc.name'])
      .where('mc."id" = :id', { id })
      .getOne()

    if (!data) throw new NotFoundException('not_found_category')
    return {
      id: Number(data.id),
      name: data.name
    }
  }

  async create(options: PostMissionCategoryReqDto): Promise<PostMissionCategoryResDto> {
    try {
      const missionCategory = new MissionCategory({
        name: options.name
      })
      const saved = await this.missionCategoryRepo.save(missionCategory)
      return { id: Number(saved.id) }
    } catch (e) {
      if (e.code === '23505' || e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('duplicate_category')
      }
      throw e
    }
  }

  async update(id: number, options: PatchMissionCategoryReqDto): Promise<PostMissionCategoryResDto> {
    const missionCategory = await this.missionCategoryRepo.findOne({ where: { id } })
    if (!missionCategory) throw new NotFoundException('not_found_category')

    if (options.name !== undefined) {
      missionCategory.name = options.name
    }

    try {
      const saved = await this.missionCategoryRepo.save(missionCategory)
      return { id: Number(saved.id) }
    } catch (e) {
      if (e.code === '23505' || e.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('duplicate_category')
      }
      throw e
    }
  }

  async delete(id: number): Promise<void> {
    const result = await this.missionCategoryRepo.delete({ id })
    if ((result.affected ?? 0) === 0) {
      throw new NotFoundException('not_found_category')
    }
  }
}
