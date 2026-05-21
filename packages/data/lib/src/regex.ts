export const tel = /^\d{8,11}$/
export const telInternational = /^\+[1-9]\d{3,14}$/
export const phone = /^01([016789]?)(\d{3,4})(\d{4})$/
export const identityNumber = /^\d{13}$/
export const businessNumber = /^\d{10}$/
export const userBirthDay = /^[0-9]{4}(0[1-9]|1[0-2])(0[1-9]|[1-2][0-9]|3[0-1])$/
export const zipCode = /^\d{5,6}$/
export const aspectRatio = /(\d{1,4}):(\d{1,4})/
export const hashtag = /^#[^ !@#$%^&*(),.?":{}|<>]{1,20}$/
export const date = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/
export const datetime = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]$/
export const time = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
export const userName = /^\w{4,20}$/
export const keyword = /^\S{1,100}$/
export const pinCode = /^\d{4}$/
export const number = /^\d+$/
export const verificationCode = /^\d{6}$/
export const versionShort = /^\d{1,3}\.\d{1,3}$/
export const version = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/
export const ip =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

export const password = {
  admin: /^[\da-zA-Z!@#$%^&*()?+-_~=/]{6,40}$/,
  vendor: /^[\da-zA-Z!@#$%^&*()?+-_~=/]{6,40}$/,
  user: /^[\da-zA-Z!@#$%^&*()?+-_~=/]{6,40}$/
}
