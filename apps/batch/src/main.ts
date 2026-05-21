import { init, listen } from './app'

init()
  .then(listen)
  .catch((e) => {
    throw e
  })
