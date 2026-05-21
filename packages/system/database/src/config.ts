export const config = () => ({
  database: {
    type: 'postgres',
    timezone: '+00:00',
    charset: 'utf8',
    synchronize: false,
    logging: false,
    bigNumberStrings: false,
    logger: 'debug'
  }
})
