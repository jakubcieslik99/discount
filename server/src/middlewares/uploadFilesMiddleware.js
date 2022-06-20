import createError from 'http-errors'
import path from 'path'

const isProperAmount = (minAmount, maxAmount) => (req, res, next) => {
  let uploads = []
  if (Array.isArray(req.files.uploads)) {
    req.files.uploads.forEach(file => {
      if (file !== undefined && file !== null) uploads.push(file)
    })
  } else if (req.files.uploads !== undefined && req.files.uploads !== null) {
    uploads.push(req.files.uploads)
  }

  if (uploads.length < minAmount) return next(createError(411, 'Przesłano zbyt mało plików.'))
  if (uploads.length > maxAmount) return next(createError(422, 'Przesłano zbyt wiele plików.'))

  res.locals.uploads = uploads

  return next()
}

const isProperAmountUpdated = (minAmount, maxAmount, fieldname) => (req, res, next) => {
  let modifiedFiles = []
  if (Array.isArray(req.body[fieldname])) {
    req.body[fieldname].forEach(file => {
      if ((typeof file === 'string' || file instanceof String) && file !== '') modifiedFiles.push(file)
    })
  } else if (
    (typeof req.body[fieldname] === 'string' || req.body[fieldname] instanceof String) &&
    req.body[fieldname] !== ''
  ) {
    modifiedFiles.push(req.body[fieldname])
  }

  let uploads = []
  if (Array.isArray(req.files.uploads)) {
    req.files.uploads.forEach(file => {
      if (file !== undefined && file !== null) uploads.push(file)
    })
  } else if (req.files.uploads !== undefined && req.files.uploads !== null) {
    uploads.push(req.files.uploads)
  }

  if (modifiedFiles.length + uploads.length < minAmount) return next(createError(411, 'Przesłano zbyt mało plików.'))
  if (modifiedFiles.length + uploads.length > maxAmount) return next(createError(422, 'Przesłano zbyt wiele plików.'))

  res.locals.modifiedFiles = modifiedFiles
  res.locals.uploads = uploads

  return next()
}

const isProperExtension = extensions => (req, res, next) => {
  const { modifiedFiles, uploads } = res.locals

  if (modifiedFiles) {
    modifiedFiles.forEach(file => {
      if (!extensions.includes(path.extname(file))) return next(createError(415, 'Niepoprawny format pliku.'))
    })
  }

  uploads.forEach(file => {
    if (!extensions.includes(path.extname(file.name))) return next(createError(415, 'Niepoprawny format pliku.'))
  })

  return next()
}

const isProperSize = megabyteSize => (req, res, next) => {
  const { uploads } = res.locals

  const byteSize = 1024 * 1024 * megabyteSize

  uploads.forEach(file => {
    if (file.size > byteSize) return next(createError(413, 'Zbyt duży rozmiar jednego lub więcej plików.'))
  })

  return next()
}

export { isProperAmount, isProperAmountUpdated, isProperExtension, isProperSize }
