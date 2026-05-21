export default {
  host: {
    api: 'http://localhost:4000',
    web: 'http://localhost:3000'
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  database: {
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'backend',
    synchronize: true,
    logging: false
  }
}
