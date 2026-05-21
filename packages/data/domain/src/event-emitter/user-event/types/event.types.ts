export enum UserEventType {
  USER_SIGNED_UP = 'USER_SIGNED_UP'
}

export interface UserSignedUpMetadata {
  userId: number
}

export type UserEventMetadataMap = {
  [UserEventType.USER_SIGNED_UP]: UserSignedUpMetadata
}

export interface UserBaseEvent<T extends UserEventType> {
  type: T
  metadata: UserEventMetadataMap[T]
}
