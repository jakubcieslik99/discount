import express from 'express'
import { isValidId } from '../middlewares/validityMiddleware'
import { isAuth } from '../middlewares/authMiddleware'
import { isPageLimit } from '../middlewares/paginationMiddleware'
import { errorHandler } from '../middlewares/errorMiddleware'
import {
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
} from '../controllers/userController'

const router = express.Router()

router.get('/listDiscounts', isPageLimit(15), errorHandler(listDiscounts))
router.get('/listDiscountDetails/:id', isValidId('id', null), errorHandler(listDiscountDetails))

router.post('/createDiscount', isAuth, errorHandler(createDiscount))
router.put('/updateDiscount/:id', isValidId('id', null), isAuth, errorHandler(updateDiscount))
router.delete('/deleteDiscount/:id', isValidId('id', null), isAuth, errorHandler(deleteDiscount))

router.get('/listDiscountRatings/:id', isValidId('id', null), errorHandler(listDiscountRatings))
router.post('/rateDiscount/:id', isValidId('id', null), isAuth, errorHandler(rateDiscount))
router.delete('/unrateDiscount/:id', isValidId('id', null), isAuth, errorHandler(unrateDiscount))

router.get('/listDiscountComments/:id', isValidId('id', null), errorHandler(listDiscountComments))
router.post('/commentDiscount/:id', isValidId('id', null), isAuth, errorHandler(commentDiscount))
router.delete('/uncommentDiscount/:id/:commentId', isValidId('id', 'commentId'), isAuth, errorHandler(uncommentDiscount))

export default router
