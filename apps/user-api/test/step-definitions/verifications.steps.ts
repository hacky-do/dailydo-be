import { Then, When } from '@cucumber/cucumber'
import SharedWorld from '../support/shared.world'

When('사용자가 {string} 타입으로 Email OTP 발급을 요청한다', async function (this: SharedWorld, type) {
  // const data = new PostVerificationEmailReqDto()
  // data.email = this.getSharedData('email')
  // data.type = type
  //
  // expect(validator.isEmail(data.email)).toBeTruthy()
  // expect(typeof data.type).toBe('string')
  //
  // const {body} = await this.agent.post('/llm/email').send(data).expect(201)
  // expect(typeof body.codeToken).toBe('string')
  // expect(typeof body.expireAt).toBe('string')
  // expect(typeof body.code).toBe('string')
  //
  // this.setSharedData('codeToken', body.codeToken)
  // this.setSharedData('code', body.code)
})

When('사용자가 Phone OTP 발급을 요청한다', async function (this: SharedWorld) {
  // const data = new PostVerificationPhoneReqDto()
  // data.phone = this.getSharedData('phone')
  //
  // expect(data.phone).toMatch(regex.phone)
  // expect(typeof data.type).toBe('string')
  //
  // const {body} = await this.agent.post('/llm/phone').send(data).expect(201)
  // expect(typeof body.codeToken).toBe('string')
  // expect(typeof body.expireAt).toBe('string')
  // expect(typeof body.code).toBe('string')
  //
  // this.setSharedData('codeToken', body.codeToken)
  // this.setSharedData('code', body.code)
})

Then('사용자가 OTP를 검증했다', async function (this: SharedWorld) {
  // const data = new PostLlmJsonReqDto()
  // data.codeToken = this.getSharedData('codeToken')
  // data.code = this.getSharedData('code')
  //
  // const {body} = await this.agent.post('/llm/confirm').send(data).expect(200)
  // expect(typeof body.codeToken).toBe('string')
  // this.setSharedData('codeToken', body.codeToken)
})
