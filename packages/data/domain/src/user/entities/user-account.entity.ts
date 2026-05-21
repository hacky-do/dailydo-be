import { IsEnum, IsString } from 'class-validator'
import { Column, Entity, ManyToOne, PrimaryColumn, type Relation, Unique } from 'typeorm'
import { User } from './user.entity'
import { UserAccountType } from '../user.type'

@Unique(['type', 'accountId'])
@Entity({ name: 'UserAccount' })
export class UserAccount {
  @PrimaryColumn()
  userId: number

  @ManyToOne(() => User, (user) => user.accounts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  user: Relation<User>

  @IsEnum(UserAccountType)
  @Column({ primary: true, type: 'enum', enum: UserAccountType })
  type: UserAccountType

  @IsString()
  @Column({ length: 100 })
  accountId: string

  constructor(partial: Partial<UserAccount>) {
    Object.assign(this, partial)
  }
}
