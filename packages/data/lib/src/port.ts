import net from 'node:net'

/**
 * 사용 가능한 포트를 찾는 함수
 * @param {number} startPort 시작 포트 번호
 * @param {number} endPort 종료 포트 번호
 * @returns {Promise<number>} 사용 가능한 포트 번호
 */
export function findAvailablePort(startPort: number, endPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const port = startPort
    const server = net.createServer()

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        if (port < endPort) {
          resolve(findAvailablePort(port + 1, endPort))
        } else {
          reject(new Error('No available ports'))
        }
      } else {
        reject(err)
      }
    })

    server.once('listening', () => {
      server.close(() => resolve(port))
    })

    server.listen(port)
  })
}
