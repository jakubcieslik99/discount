import express from 'express'
import { isValidId } from '../middlewares/validityMiddleware'
import { isAuth } from '../middlewares/authMiddleware'
import { isAdmin } from '../middlewares/permissionsMiddleware'
import { isPageLimit } from '../middlewares/paginationMiddleware'
import { errorHandler } from '../middlewares/errorMiddleware'
import { adminChangeRankUser, adminDeleteUser, adminListUsers } from '../controllers/adminUserController'

const router = express.Router()

router
  .put('/adminChangeRankUser/:id', isValidId('id', null), isAuth, isAdmin, errorHandler(adminChangeRankUser))
  .delete('/adminDeleteUser/:id', isValidId('id', null), isAuth, isAdmin, errorHandler(adminDeleteUser))
  .get('/adminListUsers', isAuth, isAdmin, isPageLimit(15), errorHandler(adminListUsers))

export default router
