import { init, listen } from './app'

process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('DEP0040')) {
    return
  }
  console.warn(warning)
})

init()
  .then(listen)
  .catch((e) => {
    throw e
  })
