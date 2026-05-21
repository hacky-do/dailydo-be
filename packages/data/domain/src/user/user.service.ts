import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'
import { UserGender } from './user.type'

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async findOne(id: number) {
    const ret = await this.userRepository.findOne({ where: { id }, relations: { setting: true, accounts: true } })
    if (ret) {
      const { accounts, ...user } = ret
      const accountList = accounts.reduce((prev, curr) => {
        // if (curr.type === 'email' && curr.accountInfo) prev.push(curr.type)
        return prev
      }, [])
      return { ...user, accounts: accountList }
    }
    throw new NotFoundException()
  }

  async update(
    id: number,
    options: {
      name?: string
      gender?: UserGender
      birth?: string
      countryId?: number
      address?: string
      addressDetail?: string
      zipCode?: string
    }
  ): Promise<{ id: number }> {
    return { id: 0 }
  }

  async findByEmailOrPhone(options: { email?: string; phone?: string }) {
    if (!options.email && !options.phone) throw new BadRequestException('email_or_phone_required')
    const query = this.userRepository.createQueryBuilder('u').innerJoinAndSelect('u.accounts', 'a')
    if (options.email) query.where('u.email = :email', { email: options.email })
    if (options.phone) query.where('u.phone = :phone', { phone: options.phone })
    return query.getOne()
  }
}
