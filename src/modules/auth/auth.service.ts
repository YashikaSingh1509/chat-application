import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user and generate access token
   */
  async register(registerDto: RegisterDto) {
    // 1. Create user (handles duplicate email check and bcrypt hashing)
    const user = await this.usersService.create(registerDto);

    // 2. Generate JWT payload
    const userId = (user as any)._id?.toString() || (user as any).id;
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
    };

    // 3. Sign token
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  /**
   * Validate credentials and generate access token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find user including password (select: '+password')
    const user = await this.usersService.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Prepare safe user object (strip password)
    const userObj = user.toObject();
    delete userObj.password;

    // 4. Generate JWT payload
    const userId = (user as any)._id?.toString() || (user as any).id;
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
    };

    // 5. Sign token
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: userObj,
    };
  }
}

