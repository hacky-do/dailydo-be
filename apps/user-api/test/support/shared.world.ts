import { setWorldConstructor, World } from '@cucumber/cucumber'
import request from 'supertest'

interface SharedData {
  [key: string]: any
}

export default class SharedWorld extends World {
  agent: request.Agent
  private sharedData: SharedData = {}

  constructor(options: any) {
    super(options)
    this.agent = options.agent
  }

  public setSharedData(key: string, value: any): void {
    this.sharedData[key] = value
  }

  public getSharedData(key: string): any {
    return this.sharedData[key]
  }
}

setWorldConstructor(SharedWorld)
