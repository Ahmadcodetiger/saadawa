// controllers/user.controller.ts
import { Response } from 'express';
import { User } from '../models/index.js';
import { ApiResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import bcrypt from 'bcryptjs';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await User.findById(req.user?.id).select('-password_hash');
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, user, 'Profile retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const allowedUpdates = ['first_name', 'last_name', 'address', 'city', 'state', 'date_of_birth', 'profile_image'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const user = await User.findByIdAndUpdate(
        req.user?.id,
        { ...updates, updated_at: new Date() },
        { new: true }
      ).select('-password_hash');

      return ApiResponse.success(res, user, 'Profile updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async uploadKYC(req: AuthRequest, res: Response) {
    try {
      const { kyc_document_id_front_url, kyc_document_id_back_url } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user?.id,
        {
          kyc_document_id_front_url,
          kyc_document_id_back_url,
          kyc_status: 'pending',
          updated_at: new Date()
        },
        { new: true }
      ).select('-password_hash');

      return ApiResponse.success(res, user, 'KYC documents uploaded successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password_hash')
        .skip(skip)
        .limit(limit)
        .sort({ created_at: -1 });

      const total = await User.countDocuments();

      return ApiResponse.paginated(res, users, {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }, 'Users retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async getUserById(req: AuthRequest, res: Response) {
    try {
      // IDOR Protection: Only allow user to see their own profile or admin to see any
      if (req.user?.id !== req.params.id && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return ApiResponse.error(res, 'Unauthorized access', 403);
      }

      const user = await User.findById(req.params.id).select('-password_hash');
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateUser(req: AuthRequest, res: Response) {
    try {
      // IDOR Protection: Only allow user to update their own profile or admin
      if (req.user?.id !== req.params.id && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
        return ApiResponse.error(res, 'Unauthorized access', 403);
      }

      const allowedUpdates = ['first_name', 'last_name', 'email', 'phone_number', 'status', 'kyc_status'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { ...updates, updated_at: new Date() },
        { new: true }
      ).select('-password_hash');

      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      // IDOR Protection: Only allow super_admin to delete users
      if (req.user?.role !== 'super_admin') {
        return ApiResponse.error(res, 'Only super admins can delete users', 403);
      }
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async deleteProfile(req: AuthRequest, res: Response) {
    try {
      const user = await User.findByIdAndUpdate(
        req.user?.id,
        { status: 'deleted', updated_at: new Date() },
        { new: true }
      );

      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      return ApiResponse.success(res, null, 'Profile deactivated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async setTransactionPin(req: AuthRequest, res: Response) {
    try {
      const { pin } = req.body as { pin: string };
      if (!pin || !/^\d{4}$/.test(String(pin))) {
        return ApiResponse.error(res, 'PIN must be a 4-digit number', 400);
      }

      const user = await User.findById(req.user?.id);
      if (!user) return ApiResponse.error(res, 'User not found', 404);

      if (user.transaction_pin) {
        return ApiResponse.error(res, 'Transaction PIN already set. Use update endpoint.', 400);
      }

      const hash = await bcrypt.hash(String(pin), 10);
      user.transaction_pin = hash;
      user.updated_at = new Date();
      await user.save();

      return ApiResponse.success(res, null, 'Transaction PIN set successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updateTransactionPin(req: AuthRequest, res: Response) {
    try {
      const { current_pin, new_pin } = req.body as { current_pin?: string; new_pin: string };
      if (!new_pin || !/^\d{4}$/.test(String(new_pin))) {
        return ApiResponse.error(res, 'New PIN must be a 4-digit number', 400);
      }

      const user = await User.findById(req.user?.id);
      if (!user) return ApiResponse.error(res, 'User not found', 404);

      if (!user.transaction_pin) {
        const hash = await bcrypt.hash(String(new_pin), 10);
        user.transaction_pin = hash;
        user.updated_at = new Date();
        await user.save();
        return ApiResponse.success(res, null, 'Transaction PIN set successfully');
      }

      if (!current_pin || !/^\d{4}$/.test(String(current_pin))) {
        return ApiResponse.error(res, 'Current PIN is required and must be 4 digits', 400);
      }

      const ok = await bcrypt.compare(String(current_pin), user.transaction_pin);
      if (!ok) {
        return ApiResponse.error(res, 'Current PIN is incorrect', 400);
      }

      user.transaction_pin = await bcrypt.hash(String(new_pin), 10);
      user.updated_at = new Date();
      await user.save();

      return ApiResponse.success(res, null, 'Transaction PIN updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  static async updatePassword(req: AuthRequest, res: Response) {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return ApiResponse.error(res, 'Current and new passwords are required', 400);
      }

      const user = await User.findById(req.user?.id);
      if (!user) {
        return ApiResponse.error(res, 'User not found', 404);
      }

      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return ApiResponse.error(res, 'Current password is incorrect', 400);
      }

      // Strong password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(new_password)) {
        return ApiResponse.error(res, 'New password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character', 400);
      }

      user.password_hash = await bcrypt.hash(new_password, 10);
      user.updated_at = new Date();
      await user.save();

      return ApiResponse.success(res, null, 'Password updated successfully');
    } catch (error: any) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}