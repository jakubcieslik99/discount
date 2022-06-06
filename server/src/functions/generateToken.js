import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import { config, log } from '../config/utilities'

const getToken = (userId, userEmail) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        id: userId,
        email: userEmail,
      },
      config.JWT_TOKEN_SECRET,
      { expiresIn: '7d' },
      (error, token) => {
        if (error) {
          log.error(error.message)
          return reject(createError(500, 'Błąd serwera.'))
        }
        return resolve(token)
      }
    )
  })
}

export default getToken
