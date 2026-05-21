import { When } from '@cucumber/cucumber'
import { regex } from '@data/lib'
import expect from 'expect'
import validator from 'validator'
import { PostAuthReqDto } from '../../src/controllers/auth/dto/req/post-auth.req.dto'
import SharedWorld from '../support/shared.world'

When('사용자가 이메일 로그인에 성공했다', async function (this: SharedWorld) {
  const data = new PostAuthReqDto()
  data.email = this.getSharedData('email')
  data.password = this.getSharedData('password')
  expect(validator.isEmail(data.email)).toBeTruthy()
  expect(data.password).toMatch(regex.password.admin)
  await this.agent.post('/auth').send(data).expect(200)
})
