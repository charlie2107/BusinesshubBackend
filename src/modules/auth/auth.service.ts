import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

async register(registerDto: RegisterDto) {
  const { name, email, password } = registerDto;

  const existingUser = await this.usersService.findByEmail(email);
  if (existingUser) throw new UnauthorizedException('Email already in use');

  // Let the schema pre-save hook hash the password
  const user = await this.usersService.create({
    name,
    email,
    password,
  });

  const payload = { sub: user._id, email: user.email };
  const token = this.jwtService.sign(payload);

  return { user, token };
}


async login(loginDto: LoginDto) {
  const { email, password } = loginDto;

  const user = await this.usersService.findByEmail(email);
  console.log('User:', user);
  if (!user) throw new UnauthorizedException('Invalid credentials');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('Password valid?', isPasswordValid);
  if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

  const payload = { sub: user._id, email: user.email };
  const token = this.jwtService.sign(payload);

  return { user, token };
}



}
