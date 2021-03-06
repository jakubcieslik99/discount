import createError from 'http-errors'
import { createDirectory, removeDirectory, saveFiles, filterFiles } from '../functions/manageUploads'
import Discount from '../models/discountModel'
import {
  createDiscountValidation,
  updateDiscountValidation,
  commentDiscountValidation,
  categoriesValidation,
} from '../validations/discountValidation'

//GET - /discounts/listDiscounts
const listDiscounts = async (req, res, next) => {
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
  const listedDiscounts = await Discount.find(query, '-ratings.ratedBy -comments')
    .populate('addedBy', 'nick')
    .sort(sortOrder)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec()

  return res.status(200).send({ count, discounts: listedDiscounts })
}
//GET - /discounts/listDiscountDetails/:id
const listDiscountDetails = async (req, res) => {
  const listedDiscount = await Discount.findById(req.params.id, '-ratings -comments').populate('addedBy', 'nick').exec()
  if (!listedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  return res.status(200).send({ discount: listedDiscount })
}

//POST - /discounts/createDiscount
const createDiscount = async (req, res) => {
  const { authenticatedUser, uploads } = res.locals

  const validationResult = await createDiscountValidation.validateAsync({
    title: req.body.title,
    price: req.body.price,
    prevprice: req.body.prevprice || 0,
    store: req.body.store || '',
    freeShipping: req.body.freeShipping || false,
    description: req.body.description || '',
    discountCode: req.body.discountCode || '',
    link: req.body.link,
    category: req.body.category || 'inne',
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

  await createDirectory(`discounts/${newDiscount.id}`)
  newDiscount.images = await saveFiles(uploads, `discounts/${newDiscount.id}`)

  await newDiscount.save()

  return res.status(201).send({ message: 'Dodano now?? okazj??.', discount: newDiscount })
}
//PUT - /discounts/updateDiscount/:id
const updateDiscount = async (req, res) => {
  const { authenticatedUser, modifiedFiles, uploads } = res.locals

  const validationResult = await updateDiscountValidation.validateAsync({
    title: req.body.title,
    price: req.body.price,
    prevprice: req.body.prevprice || 0,
    store: req.body.store || '',
    freeShipping: req.body.freeShipping || false,
    description: req.body.description || '',
    discountCode: req.body.discountCode || '',
    link: req.body.link,
    category: req.body.category || 'inne',
  })

  const updatedDiscount = await Discount.findById(req.params.id, '-ratings -comments')
  if (!updatedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  if (updatedDiscount.addedBy.toString() === authenticatedUser.id || authenticatedUser.isAdmin) {
    updatedDiscount.title = validationResult.title
    updatedDiscount.price = validationResult.price
    updatedDiscount.prevprice = validationResult.prevprice
    updatedDiscount.store = validationResult.store
    updatedDiscount.freeShipping = validationResult.freeShipping
    updatedDiscount.description = validationResult.description
    updatedDiscount.discountCode = validationResult.discountCode
    updatedDiscount.link = validationResult.link
    updatedDiscount.category = validationResult.category

    updatedDiscount.images = await filterFiles(modifiedFiles, uploads, `discounts/${updatedDiscount.id}`)

    await updatedDiscount.save()
  } else throw createError(403, 'Brak wystarczaj??cych uprawnie??.')

  return res.status(200).send({ message: 'Zaktualizowano okazj??.', discount: updatedDiscount })
}
//DELETE - /discounts/deleteDiscount/:id
const deleteDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const deletedDiscount = await Discount.findById(req.params.id).exec()
  if (!deletedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  if (deletedDiscount.addedBy.toString() === authenticatedUser.id || authenticatedUser.isAdmin) {
    await removeDirectory(`discounts/${deletedDiscount.id}`)

    await deletedDiscount.remove()
  } else throw createError(403, 'Brak wystarczaj??cych uprawnie??.')

  return res.status(200).send({ message: 'Usuni??to okazj??.' })
}

//GET - /discounts/listDiscountRatings/:id
const listDiscountRatings = async (req, res) => {
  const listedDiscount = await Discount.findById(req.params.id, '-ratings.ratedBy').exec()
  if (!listedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  return res.status(200).send({ ratings: listedDiscount.ratings })
}
//POST - /discounts/rateDiscount/:id
const rateDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  if (req.body.rating !== 'true' && req.body.rating !== 'false') throw createError(422, 'Przes??ano b????dne dane.')

  const ratedDiscount = await Discount.findById(req.params.id, 'addedBy ratings').exec()
  if (!ratedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  if (ratedDiscount.addedBy.toString() === authenticatedUser.id) throw createError(409, 'Nie mo??esz oceni?? swojej okazji.')

  const ratingIndex = ratedDiscount.ratings.findIndex(rating => rating.ratedBy.toString() === authenticatedUser.id)
  if (ratingIndex >= 0) ratedDiscount.ratings[ratingIndex].rating = req.body.rating === 'true' ? true : false
  else {
    const newRating = {
      ratedBy: authenticatedUser.id,
      rating: req.body.rating === 'true' ? true : false,
    }
    ratedDiscount.ratings.push(newRating)
  }

  await ratedDiscount.save()

  return res.status(200).send({ message: 'Dodano ocen??.', ratings: ratedDiscount.ratings })
}
//DELETE - /discounts/unrateDiscount/:id
const unrateDiscount = async (req, res) => {
  const { authenticatedUser } = res.locals

  const unratedDiscount = await Discount.findById(req.params.id, 'ratings').exec()
  if (!unratedDiscount) throw createError(404, 'Podana okazja nie istnieje.')

  const unratingIndex = unratedDiscount.ratings.findIndex(rating => rating.ratedBy.toString() === authenticatedUser.id)
  if (unratingIndex < 0) throw createError(404, 'Podana ocena nie istnieje.')

  unratedDiscount.ratings = unratedDiscount.ratings.splice(unratingIndex, 1)

  await unratedDiscount.save()

  return res.status(200).send({ message: 'Usuni??to ocen??.', ratings: unratedDiscount.ratings })
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

  const newCommentedDiscount = await Discount.findById(commentedDiscount.id, 'comments')
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

  const deletedCommentIndex = commentedDiscount.comments.findIndex(comment => comment.id === req.params.commentId)
  if (deletedCommentIndex < 0) throw createError(404, 'Podany komentarz nie istnieje.')

  if (
    commentedDiscount.comments[deletedCommentIndex].commentedBy.toString() === authenticatedUser.id ||
    authenticatedUser.isAdmin
  ) {
    if (commentedDiscount.comments[deletedCommentIndex].deleted === true)
      throw createError(409, 'Podany komentarz zosta?? ju?? usuni??ty.')

    commentedDiscount.comments[deletedCommentIndex].message = 'Komentarz zosta?? usuni??ty.'
    commentedDiscount.comments[deletedCommentIndex].deleted = true

    await commentedDiscount.save()

    const newCommentedDiscount = await Discount.findById(commentedDiscount.id, 'comments')
      .populate({
        path: 'comments',
        populate: { path: 'commentedBy', select: 'nick' },
      })
      .exec()

    return res.status(200).send({ comments: newCommentedDiscount.comments })
  } else throw createError(403, 'Brak wystarczaj??cych uprawnie??.')
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
