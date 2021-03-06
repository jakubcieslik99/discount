import createError from 'http-errors'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { removeDirectory } from '../functions/manageUploads'
import User from '../models/userModel'
import Discount from '../models/discountModel'
import { config } from '../config/utilities'
import {
  registerUserValidation,
  loginUserValidation,
  updateUserValidation,
  resendUserAccountConfirmationValidation,
  confirmUserAccountValidation,
  sendUserPasswordResetValidation,
  resetUserPasswordValidation,
} from '../validations/userValidation'
import getToken from '../functions/generateToken'
import sendEmail from '../functions/sendEmail'
import { registerUserMessage, resendUserAccountConfirmationMessage } from '../messages/registerMessages'
import { sendUserPasswordResetMessage } from '../messages/passwordMessages'

//POST - /users/registerUser
const registerUser = async (req, res) => {
  if (req.cookies?.token) throw createError(409, 'Inny użytkownik jest zalogowany.')

  const validationResult = await registerUserValidation.validateAsync(req.body)

  const conflictUserEmail = await User.findOne({ email: validationResult.email.toLowerCase() }).exec()
  if (conflictUserEmail) throw createError(409, 'Istnieje już użytkownik o podanym adresie email.')
  const conflictUserNick = await User.findOne({ nick: validationResult.nick }).exec()
  if (conflictUserNick) throw createError(409, 'Istnieje już użytkownik o podanym nicku.')

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(validationResult.password, salt)
  const token = crypto.randomBytes(64).toString('hex')

  const createUser = new User({
    email: validationResult.email.toLowerCase(),
    nick: validationResult.nick,
    password: hashedPassword,
    token,
  })
  await createUser.save()

  await sendEmail(registerUserMessage(validationResult.email.toLowerCase(), validationResult.nick, token))

  return res.status(201).send({
    message:
      'Zarejestrowano pomyślnie. Teraz potwierdź rejestrację za pomocą otrzymanej wiadomości email, aby się zalogować.',
  })
}
//POST - /users/loginUser
const loginUser = async (req, res) => {
  if (req.cookies?.token) throw createError(409, 'Użytkownik jest zalogowany.')

  const validationResult = await loginUserValidation.validateAsync(req.body)

  const loggedUser = await User.findOne({ email: validationResult.email.toLowerCase() }).exec()
  if (!loggedUser) throw createError(404, 'Konto użytkownika nie istnieje lub zostało usunięte.')

  if (!loggedUser.confirmed) throw createError(401, 'Email nie został potwierdzony.')

  const checkPassword = await bcrypt.compare(validationResult.password, loggedUser.password)
  if (!checkPassword) throw createError(401, 'Błędny email lub hasło.')

  const token = await getToken(loggedUser.id, loggedUser.email, loggedUser.nick, loggedUser.isAdmin)
  if (!token) throw createError(500, 'Błąd serwera.')

  res
    .cookie('token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: config.ENV !== 'test' ? true : false,
      maxAge: 7 * 24 * 3600 * 1000,
    })
    .status(200)
    .send({
      message: 'Zalogowano pomyślnie. Nastąpi przekierowanie do profilu.',
      userInfo: {
        id: loggedUser.id,
        email: loggedUser.email,
        nick: loggedUser.nick,
        isAdmin: loggedUser.isAdmin,
      },
      token: token,
    })
}

//PUT - /users/updateUser
const updateUser = async (req, res) => {
  const { authenticatedUser } = res.locals
  if (authenticatedUser.id !== req.body.id) throw createError(422, 'Przesłano błędne dane.')

  const validationResult = await updateUserValidation.validateAsync({
    email: req.body.email.toLowerCase(),
    nick: req.body.nick,
    password: req.body.password,
    newpassword: req.body.newpassword || '',
  })

  const conflictUserEmail = await User.findOne({ email: validationResult.email }).exec()
  if (conflictUserEmail && conflictUserEmail.id !== req.body.id)
    throw createError(409, 'Istnieje już użytkownik o podanym adresie email.')
  const conflictUserNick = await User.findOne({ nick: validationResult.nick }).exec()
  if (conflictUserNick && conflictUserNick.id !== req.body.id)
    throw createError(409, 'Istnieje już użytkownik o podanym nicku.')

  const updateUser = await User.findById(req.body.id).exec()
  if (!updateUser) throw createError(404, 'Podany użytkownik nie istnieje.')

  const checkPassword = await bcrypt.compare(validationResult.password, updateUser.password)
  if (!checkPassword) throw createError(401, 'Błędne hasło.')

  updateUser.email = validationResult.email
  updateUser.nick = validationResult.nick
  if (validationResult.newpassword !== '') {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(validationResult.newpassword, salt)
    updateUser.password = hashedPassword
  }
  const updatedUser = await updateUser.save()

  const token = await getToken(updatedUser.id, updatedUser.email, updatedUser.nick, updatedUser.isAdmin)
  if (!token) throw createError(500, 'Błąd serwera.')

  return res.status(200).send({
    message: 'Zaktualizowano profil.',
    userInfo: {
      id: updatedUser.id,
      email: updatedUser.email,
      nick: updatedUser.nick,
      isAdmin: updatedUser.isAdmin,
    },
    token: token,
  })
}
//DELETE - /users/deleteUser
const deleteUser = async (req, res) => {
  const { authenticatedUser } = res.locals
  if (authenticatedUser.id !== req.body.id) throw createError(422, 'Przesłano błędne dane.')

  const deletedUserRatedDiscounts = await Discount.find({ 'ratings.ratedBy': req.body.id }, '_id').exec()
  if (deletedUserRatedDiscounts.length > 0) {
    for (let deletedUserRatedDiscount of deletedUserRatedDiscounts) {
      const unratedDiscount = await Discount.findById(deletedUserRatedDiscount.id).exec()
      const unratingIndex = unratedDiscount.ratings.findIndex(rating => rating.ratedBy.toString() === req.body.id)
      if (unratingIndex >= 0) {
        let newRatings = unratedDiscount.ratings
        newRatings.splice(unratingIndex, 1)
        unratedDiscount.ratings = newRatings

        await unratedDiscount.save()
      }
    }
  }

  const deletedUserDiscounts = await Discount.find({ addedBy: req.body.id }, '_id').exec()
  if (deletedUserDiscounts.length > 0) {
    for (let deletedUserDiscount of deletedUserDiscounts) {
      await removeDirectory(`discounts/${deletedUserDiscount.id}`)
      await Discount.findByIdAndRemove(deletedUserDiscount.id).exec()
    }
  }

  await authenticatedUser.remove()

  if (!req.cookies?.token) return res.status(200).send({ message: 'Usunięto konto z serwisu.' })
  return res
    .clearCookie('token', { httpOnly: true, sameSite: 'none', secure: config.ENV !== 'test' ? true : false })
    .status(200)
    .send({ message: 'Usunięto konto z serwisu.' })
}

//GET - /users/logoutUser
const logoutUser = async (req, res) => {
  if (!req.cookies?.token) return res.sendStatus(204)

  return res
    .clearCookie('token', { httpOnly: true, sameSite: 'none', secure: config.ENV !== 'test' ? true : false })
    .sendStatus(204)
}

//POST - /users/resendUserAccountConfirmation
const resendUserAccountConfirmation = async (req, res) => {
  const validationResult = await resendUserAccountConfirmationValidation.validateAsync(req.body)

  const reconfirmedUser = await User.findOne({ email: validationResult.email.toLowerCase() }).exec()
  if (!reconfirmedUser) throw createError(404, 'Konto użytkownika nie istnieje.')

  const checkPassword = await bcrypt.compare(validationResult.password, reconfirmedUser.password)
  if (!checkPassword) throw createError(401, 'Błędny email lub hasło.')

  if (reconfirmedUser.confirmed) throw createError(409, 'Email został już potwierdzony.')

  reconfirmedUser.token = crypto.randomBytes(64).toString('hex')
  await reconfirmedUser.save()

  await sendEmail(
    resendUserAccountConfirmationMessage(validationResult.email.toLowerCase(), reconfirmedUser.nick, reconfirmedUser.token)
  )

  return res.status(200).send({
    message:
      'Wysłano potwierdzenie ponownie. Teraz potwierdź rejestrację za pomocą otrzymanej wiadomości email, aby się zalogować.',
  })
}
//POST - /users/confirmUserAccount
const confirmUserAccount = async (req, res) => {
  const validationResult = await confirmUserAccountValidation.validateAsync(req.body)

  const confirmedUser = await User.findOne({ token: validationResult.token }).exec()
  if (!confirmedUser) throw createError(406, 'Błąd weryfikacji. Konto mogło zostać już potwierdzone.')

  confirmedUser.token = null
  confirmedUser.confirmed = true
  await confirmedUser.save()

  return res.status(200).send({ message: 'Potwierdzono konto pomyślnie. Teraz możesz się zalogować.' })
}
//POST - /users/sendUserPasswordReset
const sendUserPasswordReset = async (req, res) => {
  const validationResult = await sendUserPasswordResetValidation.validateAsync(req.body)

  const passwordResetRequestedUser = await User.findOne({ email: validationResult.email.toLowerCase() }).exec()
  if (!passwordResetRequestedUser) throw createError(404, 'Konto użytkownika nie istnieje.')

  if (!passwordResetRequestedUser.confirmed) throw createError(409, 'Email nie został jeszcze potwierdzony.')

  passwordResetRequestedUser.token = crypto.randomBytes(64).toString('hex')
  await passwordResetRequestedUser.save()

  await sendEmail(
    sendUserPasswordResetMessage(
      validationResult.email.toLowerCase(),
      passwordResetRequestedUser.nick,
      passwordResetRequestedUser.token
    )
  )

  return res.status(200).send({ message: 'Wysłano wiadomość z linkiem do resetowania hasła.' })
}
//POST - /users/resetUserPassword
const resetUserPassword = async (req, res) => {
  const validationResult = await resetUserPasswordValidation.validateAsync(req.body)

  const passwordResetUser = await User.findOne({ token: validationResult.token }).exec()
  if (!passwordResetUser) throw createError(406, 'Błąd resetowania hasła.')

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(validationResult.password, salt)

  passwordResetUser.token = null
  passwordResetUser.password = hashedPassword
  await passwordResetUser.save()

  return res.status(200).send({ message: 'Zmieniono hasło pomyślnie. Teraz możesz się zalogować.' })
}

//GET - /users/listUser/:id
const listUser = async (req, res) => {
  const listedUser = await User.findById(req.params.id).exec()
  if (!listedUser) throw createError(404, 'Podany użytkownik nie istnieje.')

  const userDiscounts = await Discount.find({ addedBy: req.params.id }).exec()

  return res.status(200).send({
    nick: listedUser.nick,
    isAdmin: listedUser.isAdmin,
    discounts: userDiscounts,
  })
}

export {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  logoutUser,
  resendUserAccountConfirmation,
  confirmUserAccount,
  sendUserPasswordReset,
  resetUserPassword,
  listUser,
}
