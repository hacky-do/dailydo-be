import { User } from './user.entity'
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, type Relation, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'UserPassword' })
export class UserPassword {
  @Column({ primary: true })
  userId: number

  @OneToOne(() => User, (user) => user.password, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  user: Relation<User>

  @Column({ type: 'char', length: 88 })
  password: string

  @Column({ length: 88 })
  salt: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  constructor(partial: Partial<UserPassword>) {
    Object.assign(this, partial)
  }
}
