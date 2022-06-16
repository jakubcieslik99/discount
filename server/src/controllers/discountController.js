import createError from 'http-errors'
//import multer from 'multer' //refactor
import path from 'path' //refactor
import del from 'del'
import fs from 'fs' //refactor
import { Readable } from 'stream' //refactor
import { promisify } from 'util' //refactor
import Discount from '../models/discountModel'
import {
  createDiscountValidation,
  updateDiscountValidation,
  commentDiscountValidation,
  categoriesValidation,
} from '../validations/discountValidation'

//const upload = multer()
const pipeline = promisify(require('stream').pipeline)

//GET - /discounts/listDiscounts
const listDiscounts = async (req, res) => {
  const page = req.query.page ? req.query.page : 1
  const limit = req.query.limit ? req.query.limit : 15

  let query = {}
  if (req.query.category) {
    const category = await categoriesValidation.validateAsync({ category: req.query.category })
    query = { ...query, ...category }
  }
  if (req.query.searchKeyword) {
    query = { ...query, ...{ title: { $regex: req.query.searchKeyword, $options: 'i' } } }
  }

  let sortOrder = {}
  if (req.query.sortOrder && req.query.sortOrder === 'oldest') sortOrder = { createdAt: 1 }
  else if (req.query.sortOrder && req.query.sortOrder === 'expensive') sortOrder = { price: -1 }
  else if (req.query.sortOrder && req.query.sortOrder === 'cheap') sortOrder = { price: 1 }
  else sortOrder = { createdAt: -1 }

  const count = await Discount.find(query).countDocuments().exec()
  const listedDiscounts = await Discount.find(query)
    .populate('addedBy', 'nick')
    .sort(sortOrder)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec()

  return res.status(200).send({ count, discounts: listedDiscounts })
}
//GET - /discounts/listDiscountDetails/:id
const listDiscountDetails = async (req, res) => {
  const listedDiscount = await Discount.findById(req.params.id, '-ratings').populate('addedBy', 'nick').exec()
  if (!listedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  return res.status(200).send({ discount: listedDiscount })
}

//POST - /discounts/createDiscount
const createDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const validationResult = await createDiscountValidation.validateAsync({
    title: req.body.title,
    price: req.body.price,
    prevprice: req.body.prevprice,
    store: req.body.store,
    freeShipping: req.body.freeShipping,
    description: req.body.description,
    discountCode: req.body.discountCode,
    link: req.body.link,
    category: req.body.category,
  })

  const newDiscount = new Discount({
    addedBy: authenticatedUser.id,
    title: validationResult.title,
    price: validationResult.price,
    prevprice: validationResult.prevprice,
    store: validationResult.store,
    freeShipping: validationResult.freeShipping,
    description: validationResult.description,
    discountCode: validationResult.discountCode,
    link: validationResult.link,
    category: validationResult.category,
    images: [],
  })

  fs.mkdirSync(path.join(__dirname, `/../../uploads/${newDiscount._id}`), { recursive: false })
  if (req.files.length > 1) throw createError(406, 'Przesłano zbyt dużo plików.')
  else {
    for (let i = 0; i < req.files.length; i++) {
      const ext = path.extname(req.files[i].originalname)
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg')
        throw createError(406, 'Format przesłanego pliku jest niepoprawny.')
      if (req.files[i].size > 5 * 1024 * 1024) throw createError(406, 'Rozmiar przesłanego pliku jest za duży.')

      //const filename = Date.now() + '_' + req.files[i].originalName
      const filename = `${req.files[i].fieldname}-${Date.now()}_${i}${ext}`

      await pipeline(
        Readable.from(req.files[i].buffer),
        fs.createWriteStream(path.join(__dirname, `/../../uploads/${newDiscount._id}/${filename}`))
      )
      newDiscount.images.push(filename)
    }
  }

  await newDiscount.save()

  return res.status(201).send({ message: 'Dodano nową okazję.', discount: newDiscount })
}
//PUT - /discounts/updateDiscount/:id
const updateDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const validationResult = await updateDiscountValidation.validateAsync({
    title: req.body.title,
    price: req.body.price,
    prevprice: req.body.prevprice,
    store: req.body.store,
    freeShipping: req.body.freeShipping,
    description: req.body.description,
    discountCode: req.body.discountCode,
    link: req.body.link,
    category: req.body.category,
  })

  const updatedDiscount = await Discount.findById(req.params.id)
  if (!updatedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  if (updatedDiscount.addedBy == authenticatedUser.id || authenticatedUser.isAdmin) {
    let images = [],
      imagesToKeep = [],
      imagesToUpload = []
    if (Array.isArray(req.body.images)) images = req.body.images
    else if (!Array.isArray(req.body.images) && req.body.images !== undefined) images.push(req.body.images)

    if (images.length > 1) throw createError(422, 'Przesłano błędne dane.')
    else if (req.files.length > 1 - images.length) throw createError(406, 'Przesłano zbyt dużo plików.')
    else {
      for (let i = 0; i < updatedDiscount.images.length; i++) {
        if (images.includes(updatedDiscount.images[i])) imagesToKeep.push(updatedDiscount.images[i])
        else fs.unlinkSync(path.join(__dirname, `/../../uploads/${updatedDiscount._id}/${updatedDiscount.images[i]}`))
      }

      for (let i = 0; i < req.files.length; i++) {
        const ext = path.extname(req.files[i].originalname)
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg')
          throw createError(406, 'Format przesłanego pliku jest niepoprawny.')
        if (req.files[i].size > 5 * 1024 * 1024) throw createError(406, 'Rozmiar przesłanego pliku jest za duży.')

        //const filename = Date.now() + '_' + req.files[i].originalName
        const filename = `${req.files[i].fieldname}-${Date.now()}_${i}${ext}`

        await pipeline(
          Readable.from(req.files[i].buffer),
          fs.createWriteStream(path.join(__dirname, `/../../uploads/${updatedDiscount._id}/${filename}`))
        )
        imagesToUpload.push(filename)
      }
    }

    updatedDiscount.title = validationResult.title
    updatedDiscount.price = validationResult.price
    updatedDiscount.prevprice = validationResult.prevprice
    updatedDiscount.store = validationResult.store
    updatedDiscount.freeShipping = validationResult.freeShipping
    updatedDiscount.description = validationResult.description
    updatedDiscount.discountCode = validationResult.discountCode
    updatedDiscount.link = validationResult.link
    updatedDiscount.category = validationResult.category
    updatedDiscount.images = imagesToKeep.concat(imagesToUpload)

    await updatedDiscount.save()
  } else throw createError(403, 'Brak wystarczających uprawnień.')

  return res.status(200).send({ message: 'Zaktualizowano okazję.', discount: updatedDiscount })
}
//DELETE - /discounts/deleteDiscount/:id
const deleteDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const deletedDiscount = await Discount.findById(req.params.id).exec()
  if (!deletedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  if (deletedDiscount.addedBy == authenticatedUser.id || authenticatedUser.isAdmin) {
    //fs.rmdirSync(`${__dirname}/../../uploads/${deletedDiscount._id}`, {recursive: true})
    //fs.unlinkSync(`${__dirname}/../../uploads/${deletedDiscount._id}`)
    await del(path.join(__dirname, `/../../uploads/${deletedDiscount._id}`))

    await deletedDiscount.remove()

    return res.status(200).send({ message: 'Usunięto okazję.' })
  } else throw createError(403, 'Brak wystarczających uprawnień.')
}

//GET - /discounts/listDiscountRatings/:id
const listDiscountRatings = async (req, res) => {
  const listedDiscount = await Discount.findById(req.params.id, 'ratings').exec()
  if (!listedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  return res.status(200).send({ ratings: listedDiscount.ratings })
}
//POST - /discounts/rateDiscount/:id
const rateDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  if (req.body.rating !== true && req.body.rating !== false) throw createError(422, 'Przesłano błędne dane.')

  const ratedDiscount = await Discount.findById(req.params.id, 'addedBy ratings').exec()
  if (!ratedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  if (ratedDiscount.addedBy == authenticatedUser.id) throw createError(409, 'Nie możesz ocenić swojej okazji.')

  const ratingIndex = ratedDiscount.ratings.findIndex(rating => rating.ratedBy == authenticatedUser.id)
  if (ratingIndex >= 0) ratedDiscount.ratings[ratingIndex].rating = req.body.rating
  else {
    const newRating = {
      ratedBy: authenticatedUser.id,
      rating: req.body.rating,
    }
    ratedDiscount.ratings.push(newRating)
  }

  await ratedDiscount.save()

  return res.status(200).send({ message: 'Dodano ocenę.', ratings: ratedDiscount.ratings })
}
//DELETE - /discounts/unrateDiscount/:id
const unrateDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const unratedDiscount = await Discount.findById(req.params.id, 'ratings').exec()
  if (!unratedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  const unratingIndex = unratedDiscount.ratings.findIndex(rating => rating.ratedBy == authenticatedUser.id)
  if (unratingIndex < 0) throw createError(404, 'Podana ocena nie istnieje.')

  //let newRatings = unratedDiscount.ratings
  //newRatings.splice(unratingIndex, 1)
  //unratedDiscount.ratings = newRatings
  unratedDiscount.ratings = unratedDiscount.ratings.splice(unratingIndex, 1)

  await unratedDiscount.save()

  return res.status(200).send({ message: 'Usunięto ocenę.', ratings: unratedDiscount.ratings })
}

//GET - /discounts/listDiscountComments/:id
const listDiscountComments = async (req, res) => {
  const listedDiscount = await Discount.findById(req.params.id, 'comments')
    .populate({
      path: 'comments',
      populate: { path: 'commentedBy', select: 'nick' },
    })
    .exec()
  if (!listedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  return res.status(200).send({ comments: listedDiscount.comments })
}
//POST - /discounts/commentDiscount/:id
const commentDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const validationResult = await commentDiscountValidation.validateAsync(req.body)

  const commentedDiscount = await Discount.findById(req.params.id, 'comments').exec()
  if (!commentedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  const newComment = {
    commentedBy: authenticatedUser.id,
    message: validationResult.message,
    createdAt: new Date(),
  }
  commentedDiscount.comments.push(newComment)

  await commentedDiscount.save()

  const newCommentedDiscount = await Discount.findById(commentedDiscount._id, 'comments')
    .populate({
      path: 'comments',
      populate: { path: 'commentedBy', select: 'nick' },
    })
    .exec()

  return res.status(201).send({ comments: newCommentedDiscount.comments })
}
//DELETE - /discounts/uncommentDiscount/:id/:commentId
const uncommentDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const commentedDiscount = await Discount.findById(req.params.id, 'comments').exec()
  if (!commentedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  const deletedCommentIndex = commentedDiscount.comments.findIndex(comment => comment._id == req.params.commentId)
  if (deletedCommentIndex < 0) throw createError(404, 'Podany komentarz nie istnieje.')

  if (commentedDiscount.comments[deletedCommentIndex].commentedBy == authenticatedUser.id || authenticatedUser.isAdmin) {
    if (commentedDiscount.comments[deletedCommentIndex].deleted === true)
      throw createError(409, 'Podany komentarz został już usunięty.')

    commentedDiscount.comments[deletedCommentIndex].message = 'Komentarz został usunięty.'
    commentedDiscount.comments[deletedCommentIndex].deleted = true

    await commentedDiscount.save()

    const newCommentedDiscount = await Discount.findById(commentedDiscount._id, 'comments')
      .populate({
        path: 'comments',
        populate: { path: 'commentedBy', select: 'nick' },
      })
      .exec()

    return res.status(200).send({ comments: newCommentedDiscount.comments })
  } else throw createError(403, 'Brak wystarczających uprawnień.')
}

export {
  listDiscounts,
  listDiscountDetails,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  listDiscountRatings,
  rateDiscount,
  unrateDiscount,
  listDiscountComments,
  commentDiscount,
  uncommentDiscount,
}
