export default {
  host: {
    api: 'http://localhost:4000',
    web: 'http://localhost:3000'
  },
  cookieDomain: 'localhost',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Request-ID'],
    optionsSuccessStatus: 204,
    exposedHeaders: ['Request-ID']
  },
  apiDocs: {
    auth: {
      id: 'backend',
      password: 'backend_1024'
    },
    urls: [
      {
        name: 'user',
        url: '/api-docs/swagger-json'
      }
    ]
  },
  aws: {
    region: 'ap-northeast-2',
    bucket: 'backend-files',
    uploadPrefix: 'uploads',
    bucketPath: '',
    cloudfront: '',
    accessKeyId: '',
    secretAccessKey: '',
    opensearch: {
      node: []
    }
  },
  database: {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'backend',
    timezone: '+00:00',
    charset: 'utf8',
    synchronize: false,
    logging: false,
    bigNumberStrings: false,
    migrationsTableName: 'MigrationTable'
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  },
  jwt: {
    publicKey: '',
    privateKey: ''
  },
  social: {}
}
