import { GetListOrderDto, GetPaginationReqDto } from '@data/dto'
import { IsEnum, IsOptional } from 'class-validator'

export enum GetMissionCategoriesReqDtoSort {
  id = 'id',
  name = 'name',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export class GetMissionCategoriesReqDto extends GetPaginationReqDto {
  @IsOptional()
  @IsEnum(GetMissionCategoriesReqDtoSort)
  sort?: GetMissionCategoriesReqDtoSort

  @IsOptional()
  @IsEnum(GetListOrderDto)
  order?: GetListOrderDto
}
