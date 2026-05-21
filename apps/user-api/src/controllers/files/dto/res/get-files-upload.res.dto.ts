import { ApiProperty } from '@nestjs/swagger'
import { IsObject, IsString, IsUrl } from 'class-validator'

export class GetFilesUploadResDto {
  @IsString()
  @ApiProperty({ title: '저장소의 파일 경로' })
  path: string

  @IsUrl()
  @ApiProperty({ title: '업로드할 Presigned URL' })
  url: string

  @IsObject()
  @ApiProperty({ title: 'FromData의 field', description: 'Presigned URL로 전송 시 입력해야할 field 값' })
  fields: Record<string, string>

  constructor(partial: Partial<GetFilesUploadResDto>) {
    Object.assign(this, partial)
  }
}
