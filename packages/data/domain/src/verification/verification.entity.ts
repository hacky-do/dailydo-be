import { regex } from '@data/lib'
import { ApiProperty } from '@nestjs/swagger'
import { IsDate, IsEmail, IsEnum, IsInt, IsOptional, Length, Matches } from 'class-validator'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum VerificationType {
  register = 'register',
  resetPassword = 'resetPassword',
  changePhone = 'changePhone',
  findEmail = 'findEmail'
}

@Entity({ name: 'Verification' })
export class Verification {
  @IsInt()
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number

  @IsEnum(VerificationType)
  @Column({ type: 'enum', enum: VerificationType })
  type: VerificationType

  @IsOptional()
  @Matches(regex.phone)
  @ApiProperty({ pattern: regex.phone.source, required: false })
  @Column({ length: 11, nullable: true })
  phone?: string

  @IsOptional()
  @IsEmail()
  @ApiProperty({ format: 'email' })
  @Column({ length: 255, nullable: true })
  email?: string

  @Length(6, 6)
  @Column({ length: 6 })
  code: string

  @Column({ default: false })
  confirmed: boolean

  @Column({ default: false })
  used: boolean

  @IsDate()
  @CreateDateColumn()
  createdAt: Date

  @IsDate()
  @UpdateDateColumn()
  updatedAt: Date

  constructor(partial: Partial<Verification>) {
    Object.assign(this, partial)
  }
}
