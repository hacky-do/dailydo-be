import { User, UserSetting } from '@data/domain'
import { GetUserCategoriesResDto, UserAccountType } from '@data/domain/user'
import { ApiProperty, OmitType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsObject, ValidateNested } from 'class-validator'

export class GetAuthResDtoSetting extends OmitType(UserSetting, ['user', 'updatedAt']) {}

export class GetUsersResDtoTodayMissionCompletion {
  @IsNumber()
  @ApiProperty()
  totalCount: number

  @IsNumber()
  @ApiProperty()
  completedCount: number

  @IsNumber()
  @ApiProperty()
  completionRate: number
}

export class GetUsersResDtoFootprint {
  @IsNumber()
  @ApiProperty()
  daysSinceSignup: number

  @IsNumber()
  @ApiProperty()
  maxConsecutiveUseDays: number

  @IsNumber()
  @ApiProperty()
  completedMissionCount: number
}

export class GetUsersResDto extends OmitType(User, ['accounts', 'setting', 'missionCategories']) {
  @IsObject()
  @ValidateNested()
  @Type(() => GetAuthResDtoSetting)
  setting: GetAuthResDtoSetting

  @IsEnum(UserAccountType, { each: true })
  accounts: UserAccountType[]

  @IsObject()
  @ValidateNested()
  @Type(() => GetUsersResDtoTodayMissionCompletion)
  @ApiProperty({ type: GetUsersResDtoTodayMissionCompletion })
  todayMissionCompletion: GetUsersResDtoTodayMissionCompletion

  @IsObject()
  @ValidateNested()
  @Type(() => GetUsersResDtoFootprint)
  @ApiProperty({ type: GetUsersResDtoFootprint })
  footprint: GetUsersResDtoFootprint

  @IsObject()
  @ValidateNested()
  @Type(() => GetUserCategoriesResDto)
  @ApiProperty({ type: GetUserCategoriesResDto })
  categories: GetUserCategoriesResDto
}
