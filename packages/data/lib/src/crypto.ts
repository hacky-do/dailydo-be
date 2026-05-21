import * as crypto from 'node:crypto'

export function encryptRSA(data: any, publicKey: string): string {
  const encryptedData = crypto.publicEncrypt(publicKey, Buffer.from(data, 'utf8'))
  return encryptedData.toString('binary')
}

export function decryptRSA(encryptedData: string, privateKey: string): string {
  const bufferData = Buffer.from(encryptedData, 'binary')
  const decryptedData = crypto.privateDecrypt(privateKey, bufferData)
  return decryptedData.toString('utf8')
}
