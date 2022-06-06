import createError from 'http-errors'

const isAdmin = (_req, res, next) => {
  const { authenticatedUser } = res.locals

  if (!authenticatedUser) return next(createError(401, 'Błąd autoryzacji.'))
  if (!authenticatedUser.isAdmin) return next(createError(403, 'Brak wystarczających uprawnień.'))

  return next()
}

export { isAdmin }
