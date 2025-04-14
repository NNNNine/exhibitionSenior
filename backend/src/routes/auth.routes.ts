import express from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validation.middleware'
import { body } from 'express-validator'

const router = express.Router()

const authController = new AuthController()

// Register new user
router.post('/register', validate([
  body('username').isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['visitor', 'artist']).withMessage('Role must be visitor or artist')
]), authController.register)

// Login user
router.post('/login', validate([
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
]), authController.login)

// Refresh access token
router.post('/refresh-token', authController.refreshToken)

// Logout user
router.post('/logout', authController.logout)

// Get current user
router.get('/me', authenticate, authController.getCurrentUser)

// Change password
router.post('/change-password', authenticate, validate([
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
]), authController.changePassword)

// Request password reset
router.post('/forgot-password', validate([
  body('email').isEmail().withMessage('Must be a valid email address')
]), authController.forgotPassword)

// Reset password with token
router.post('/reset-password', validate([
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
]), authController.resetPassword)

export default router