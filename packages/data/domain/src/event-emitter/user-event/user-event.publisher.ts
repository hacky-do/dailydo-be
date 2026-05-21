import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserBaseEvent, UserEventType } from './types/event.types'

@Injectable()
export class UserEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish<T extends UserEventType>(event: UserBaseEvent<T>) {
    this.eventEmitter.emit(event.type, event)
  }
}
