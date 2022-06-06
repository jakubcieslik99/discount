import createError from 'http-errors'
import { log } from '../config/utilities'
import transporter from '../config/nodemailerOptions'

const sendEmail = message => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }

    transporter.sendMail(mailOptions, error => {
      if (error) {
        log.error(error)
        return reject(createError(500, 'Błąd serwera.'))
      }
      return resolve()
    })
  })
}

export default sendEmail
