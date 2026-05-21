import { Given, When } from '@cucumber/cucumber'
import { regex } from '@data/lib'
import expect from 'expect'
import * as fs from 'fs'
import path from 'path'
import validator from 'validator'
import {
  PostAuthRegisterReqDto,
  PostAuthRegisterReqDtoType
} from '../../src/controllers/auth/dto/req/post-auth-register.req.dto'
import SharedWorld from '../support/shared.world'

Given('사용자 정보를 fixture에서 가져옴', async function (this: SharedWorld) {
  const fixturePath = path.join(__dirname, '../fixtures/temp-user.json')
  const rawData = fs.readFileSync(fixturePath, 'utf-8')
  const userData = JSON.parse(rawData)
  expect(validator.isEmail(userData.email)).toBeTruthy()
  expect(userData.password).toMatch(regex.password.admin)

  this.setSharedData('email', userData.email)
  this.setSharedData('password', userData.password)
})

When('사용자가 Email 회원가입을 시도한다', async function (this: SharedWorld) {
  const data = new PostAuthRegisterReqDto()
  data.type = PostAuthRegisterReqDtoType.email
  data.email = this.getSharedData('email')
  data.password = this.getSharedData('password')
  data.codeToken = this.getSharedData('codeToken')
  data.agreeMarketing = true

  expect(validator.isEmail(data.email)).toBeTruthy()
  expect(data.password).toMatch(regex.password.admin)
  expect(typeof data.codeToken).toBe('string')

  await this.agent.post('/auth/register').send(data).expect(201)
})
