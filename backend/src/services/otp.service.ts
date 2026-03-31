import crypto from 'crypto';
import { config } from '../config/bootstrap.js';
import { OTP } from '../models/index.js';

export class OTPService {
  /**
   * Generate a cryptographically secure 6-digit OTP
   */
  static async generateOTP(): Promise<string> {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and store a new OTP after rate-limit check
   */
  static async createOTP(phone_number: string, email?: string, user_id?: string): Promise<string> {
    // Check for recent active OTP (sent in last 60 seconds) to prevent spam
    const recentOtp = await OTP.findOne({
      phone_number,
      is_used: false,
      created_at: { $gt: new Date(Date.now() - 60000) }
    });

    if (recentOtp) {
      throw new Error('Please wait 60 seconds before requesting a new OTP.');
    }

    const otp_code = await this.generateOTP();
    const expires_at = new Date(Date.now() + 600000); // 10 minutes

    await OTP.create({
      user_id: user_id ? user_id.toString() : undefined,
      phone_number,
      email,
      otp_code,
      expires_at,
      is_used: false
    });

    // For development: Log OTP to console until an email/SMS provider is configured
    console.log(`\n🔑 [OTP SERVICE] Generated OTP for ${phone_number}: ${otp_code}\n`);

    return otp_code;
  }

  /**
   * Verify an OTP and mark it as used
   */
  static async verifyOTP(phone_number: string, otp_code: string): Promise<boolean> {
    const otp = await OTP.findOne({
      phone_number,
      otp_code,
      is_used: false,
      expires_at: { $gt: new Date() }
    });

    if (!otp) {
      return false;
    }

    otp.is_used = true;
    await otp.save();
    return true;
  }
}