import { config, log } from '../config/utilities'

const errorHandler = controller => (req, res, next) => Promise.resolve(controller(req, res, next)).catch(next)

const isError = (error, _req, res, _next) => {
  if (error.isJoi === true) {
    error.status = 422
    error.message = 'Przesłano błędne dane.'
  }
  config.ENV !== 'prod' && log.error(`HTTP - ${error.status || 500}`)
  return res.status(error.status || 500).send({ message: error.message || 'Błąd serwera.' })
}

export { errorHandler, isError }
