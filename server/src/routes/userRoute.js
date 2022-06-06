import express from 'express'
import { isValidId } from '../middlewares/validityMiddleware'
import { isAuth } from '../middlewares/authMiddleware'
import { errorHandler } from '../middlewares/errorMiddleware'
import {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  resendUserAccountConfirmation,
  confirmUserAccount,
  sendUserPasswordReset,
  resetUserPassword,
  listUser,
} from '../controllers/userController'

const router = express.Router()

router.post('/registerUser', errorHandler(registerUser))
router.post('/loginUser', errorHandler(loginUser))

router.put('/updateUser', isAuth, errorHandler(updateUser))
router.delete('/deleteUser', isAuth, errorHandler(deleteUser))

router.post('/resendUserAccountConfirmation', errorHandler(resendUserAccountConfirmation))
router.post('/confirmUserAccount', errorHandler(confirmUserAccount))
router.post('/sendUserPasswordReset', errorHandler(sendUserPasswordReset))
router.post('/resetUserPassword', errorHandler(resetUserPassword))

router.get('/listUser/:id', isValidId('id', null), errorHandler(listUser))

export default router
