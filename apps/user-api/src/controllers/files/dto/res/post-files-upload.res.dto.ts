import { ApiProperty } from '@nestjs/swagger'
import { IsUrl } from 'class-validator'

export class PostFilesUploadResDto {
  @IsUrl()
  @ApiProperty({ title: '파일 URL' })
  url: string

  constructor(partial: Partial<PostFilesUploadResDto>) {
    Object.assign(this, partial)
  }
}
