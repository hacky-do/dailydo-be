import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'

async function sendEmail(
  sesClient: SESClient,
  options: { sender: string; to: string; subject: string; html: string }
): Promise<void> {
  try {
    if (['production'].indexOf(process.env.NODE_ENV) === -1) return

    const { to, html, sender } = options
    let subject = options.subject

    if (process.env.NODE_ENV !== 'production') subject = `[DEV]${subject}`
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: sender,
      ReplyToAddresses: [sender]
    })
    await sesClient.send(command)
  } catch (e) {
    throw e
  }
}

export { sendEmail }
