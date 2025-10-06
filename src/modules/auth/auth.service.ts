import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // ✅ Inject ConfigService
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new UnauthorizedException('Email already in use');

    const user = await this.usersService.create({ name, email, password });

    const payload = { sub: user._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return { user, token };
  }

  /** ------------------- FORGOT PASSWORD ------------------- */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Save hashed token & expiry (10 minutes)
    await this.usersService.update(user._id.toString(), {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: Date.now() + 10 * 60 * 1000,
    });

    // Send email with reset link
    const resetLink = `http://localhost:8080/reset-password?token=${resetToken}&email=${email}`;

    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });

    transporter.verify((error, success) => {
      if (error) console.error('SMTP Error:', error);
      else console.log('SMTP is ready to send messages');
    });

    await transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Reset Your Password</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}" 
          style="background:#4f46e5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
      `,
    });

    return { message: 'Password reset link sent to your email' };
  }

  /** ------------------- RESET PASSWORD ------------------- */
  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    if (
      !user.resetPasswordToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < Date.now()
    ) {
      throw new BadRequestException('Token expired or invalid');
    }

    const isValid = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValid) throw new BadRequestException('Invalid token');

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: 'Password reset successful' };
  }
}
