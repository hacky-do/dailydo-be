import { AfterAll, Before, BeforeAll } from '@cucumber/cucumber'
import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { UserApiModule } from '../../src/user-api.module'
import SharedWorld from './shared.world'

let app: INestApplication
let agent: request.Agent

BeforeAll(async function (this: SharedWorld) {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [UserApiModule]
  }).compile()

  app = moduleFixture.createNestApplication()
  await app.init()
  agent = request(app.getHttpServer())
})

Before(async function (this: SharedWorld) {
  this.agent = agent
})

AfterAll(async () => {
  await app.close()
})
