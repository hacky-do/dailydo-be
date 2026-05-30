import { GetListOrderDto, GetPaginationReqDto } from '@data/dto'
import { IsEnum, IsOptional } from 'class-validator'

export enum GetUserCategoriesReqDtoSort {
  id = 'id',
  sortOrder = 'sortOrder',
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export class GetUserCategoriesReqDto extends GetPaginationReqDto {
  @IsOptional()
  @IsEnum(GetUserCategoriesReqDtoSort)
  sort?: GetUserCategoriesReqDtoSort

  @IsOptional()
  @IsEnum(GetListOrderDto)
  order?: GetListOrderDto
}
