import createError from 'http-errors'
import del from 'del'
//import fs from 'fs'
import User from '../models/userModel'
import Discount from '../models/discountModel'

//PUT - /users/adminChangeRankUser/:id
const adminChangeRankUser = async (req, res) => {
  const { authenticatedUser } = res.locals
  if (authenticatedUser.id === req.params.id)
    throw createError(406, 'Nie można zmienić uprawnień do aktualnie zalogowanego konta.')

  const changedUser = await User.findById(req.params.id).exec()
  if (!changedUser) throw createError(404, 'Podany użytkownik nie istnieje.')

  const message = changedUser.isAdmin ? 'Usunięto uprawnienia administratora.' : 'Nadano uprawnienia administratora.'

  changedUser.isAdmin = !changedUser.isAdmin
  await changedUser.save()

  return res.status(200).send({ message: message })
}
//DELETE - /users/adminDeleteUser/:id
const adminDeleteUser = async (req, res) => {
  const { authenticatedUser } = res.locals
  if (authenticatedUser.id === req.params.id)
    throw createError(406, 'Nie można usunąć aktualnie zalogowanego konta z panelu administratora.')

  const deletedUser = await User.findById(req.params.id).exec()
  if (!deletedUser) throw createError(404, 'Podany użytkownik nie istnieje.')

  const deletedUserRatedDiscounts = await Discount.find({ 'ratings.ratedBy': req.params.id }, '_id').exec()
  if (deletedUserRatedDiscounts.length > 0) {
    for (let i = 0; i < deletedUserRatedDiscounts.length; i++) {
      const unratedDiscount = await Discount.findById(deletedUserRatedDiscounts[i]._id).exec()
      const unratingIndex = unratedDiscount.ratings.findIndex(rating => rating.ratedBy == req.params.id)
      if (unratingIndex >= 0) {
        let newRatings = unratedDiscount.ratings
        newRatings.splice(unratingIndex, 1)
        unratedDiscount.ratings = newRatings

        await unratedDiscount.save()
      }
    }
  }

  const deletedUserDiscounts = await Discount.find({ addedBy: req.params.id }, '_id').exec()
  if (deletedUserDiscounts.length > 0) {
    for (let i = 0; i < deletedUserDiscounts.length; i++) {
      //fs.rmdirSync(`${__dirname}/../../uploads/${deletedUserDiscounts[i]._id}`, {recursive: true})
      await del(path.join(__dirname, `/../../uploads/${deletedUserDiscounts[i]._id}`))

      await Discount.findByIdAndRemove(deletedUserDiscounts[i]._id).exec()
    }
  }

  await deletedUser.remove()

  return res.status(200).send({ message: 'Usunięto użytkownika.' })
}
//GET - /users/adminListUsers
const adminListUsers = async (req, res) => {
  const page = req.query.page ? req.query.page : 1
  const limit = req.query.limit ? req.query.limit : 15

  let query = {}
  if (req.query.searchKeyword) {
    query = {
      nick: { $regex: req.query.searchKeyword, $options: 'i' },
    }
  }

  let sortOrder = {}
  if (req.query.sortOrder && req.query.sortOrder === 'oldest') sortOrder = { createdAt: 1 }
  else if (req.query.sortOrder && req.query.sortOrder === 'newest') sortOrder = { createdAt: -1 }
  else if (req.query.sortOrder && req.query.sortOrder === 'ztoa') sortOrder = { nick: -1 }
  else sortOrder = { nick: 1 }

  let count = 0
  count = await User.find(query).countDocuments().exec()
  const listedUsers = await User.find(query, 'email nick isAdmin createdAt')
    .sort(sortOrder)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec()

  return res.status(200).send({ count, users: listedUsers })
}

export { adminChangeRankUser, adminDeleteUser, adminListUsers }
