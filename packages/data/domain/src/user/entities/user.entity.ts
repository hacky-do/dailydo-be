import { regex } from '@data/lib'
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUrl, Matches, ValidateNested } from 'class-validator'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn
} from 'typeorm'
import { UserAccount } from './user-account.entity'
import { UserPassword } from './user-password.entity'
import { UserSetting } from './user-setting.entity'
import { UserGender } from '../user.type'

@Entity({ name: 'User' })
export class User {
  @IsInt()
  @ApiProperty({ title: 'ID', format: 'int64' })
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @ApiProperty({ title: '프로필 이미지' })
  @IsOptional()
  @IsUrl()
  @Column({ nullable: true })
  profileImage?: string

  @IsEmail()
  @ApiProperty({ format: 'email' })
  @Column({ length: 300 })
  email: string

  @IsString()
  @ApiProperty({ title: '이름' })
  @Column({ length: 200 })
  name: string

  @IsOptional()
  @IsEnum(UserGender)
  @Column({ nullable: true, type: 'enum', enum: UserGender })
  gender?: UserGender

  @ApiProperty({ title: '생년월일', description: 'YYYY-MM-DD' })
  @IsOptional()
  @Matches(regex.date)
  @Column({ nullable: true })
  birth?: string

  @ApiProperty({ title: '휴대폰 번호', pattern: regex.phone.source })
  @IsOptional()
  @Matches(regex.phone)
  @Column({ nullable: true, length: 11 })
  phone: string

  @ApiHideProperty()
  @Column({ unsigned: true, default: 1 })
  version: number

  @IsDate()
  @CreateDateColumn()
  createdAt: Date

  @IsDate()
  @UpdateDateColumn()
  updatedAt: Date

  @ApiHideProperty()
  @DeleteDateColumn()
  deletedAt?: Date

  @ApiHideProperty()
  @OneToOne(() => UserPassword, (data) => data.user, { cascade: true })
  password?: Relation<UserPassword>

  @ValidateNested()
  @Type(() => UserSetting)
  @OneToOne(() => UserSetting, (data) => data.user, { cascade: true })
  setting: Relation<UserSetting>

  @OneToMany(() => UserAccount, (data) => data.user, { cascade: true })
  accounts: Relation<UserAccount>[]

  constructor(partial: Partial<User>) {
    Object.assign(this, partial)
  }
}
