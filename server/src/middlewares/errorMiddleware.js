import { config, log } from '../config/utilities'
import parseString from '../functions/parseString'

const errorHandler = controller => (req, res, next) => Promise.resolve(controller(req, res, next)).catch(next)

const isError = (error, _req, res, _next) => {
  //internal error handling
  if (!error.status) {
    log.error(`INTERNAL - ${error.stack || error.message || 'Internal error.'}`)
    return res.status(500).send({ message: 'Błąd serwera.' })
  }
  //server error handling
  if (error.status >= 500) {
    log.error(`SERVER - ${error.status}: ${error.stack || (error.message && parseString(error.message)) || 'Server error.'}`)
    return res.status(500).send({ message: 'Błąd serwera.' })
  }
  //client validation error handling
  if (error.status === 422 || error.isJoi === true) {
    config.ENV !== 'prod' &&
      log.error(`CLIENT - 422: ${!error.isJoi ? parseString(error.message) : 'Przeslano bledne dane.'}`)
    return res.status(422).send({ message: !error.isJoi ? error.message : 'Przesłano błędne dane.' })
  }
  //any other client error handling
  config.ENV !== 'prod' &&
    log.error(`CLIENT - ${error.status}: ${error.message ? parseString(error.message) : 'Blad serwera.'}`)
  return res.status(error.status).send({ message: error.message || 'Błąd serwera.' })
}

export { errorHandler, isError }
