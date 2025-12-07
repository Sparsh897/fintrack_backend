import { Router } from 'express';
import { User } from '../models/User';
import { generateToken, generateOTP, verifyToken } from '../utils/jwt';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Send OTP to mobile number
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ 
        error: 'Phone number is required' 
      });
    }

    // Validate Indian mobile number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        error: 'Please enter a valid Indian mobile number (10 digits starting with 6-9)' 
      });
    }

    // Generate OTP (always 123456 for now)
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    
    if (user) {
      // Update existing user
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.isVerified = false; // Reset verification status
      await user.save();
    } else {
      // Create new user
      user = new User({
        phoneNumber,
        otp,
        otpExpiry,
        isVerified: false
      });
      await user.save();
    }

    // In development, return OTP in response
    // In production, send via SMS service
    console.log(`[AUTH] OTP for ${phoneNumber}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // Remove this in production:
      dev_otp: otp,
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to send OTP',
      message: 'Please try again later'
    });
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ 
        error: 'Phone number and OTP are required' 
      });
    }

    // Find user
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Please request OTP first'
      });
    }

    // Check if OTP is expired
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({ 
        error: 'OTP expired',
        message: 'Please request a new OTP'
      });
    }

    // Verify OTP (for now, just check if it's 123456)
    const isValidOTP = otp === '123456' || await user.comparePassword(otp);
    
    if (!isValidOTP) {
      return res.status(400).json({ 
        error: 'Invalid OTP',
        message: 'Please enter the correct OTP'
      });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      error: 'Failed to verify OTP',
      message: 'Please try again later'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user!.userId;

    // Find and update user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: 'Please try again later'
    });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get user from database
    const user = await User.findById(userId).select('-otp -otpExpiry');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user data',
      message: 'Please try again later'
    });
  }
});

// Logout (optional - JWT is stateless)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;