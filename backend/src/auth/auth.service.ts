import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Tokens, User } from 'src/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: AuthDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashPassword,
      },
    });

    const { password, ...userWithoutHashPassword } = newUser;

    return userWithoutHashPassword;
  }

  async login(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Email does not exist.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new NotFoundException('Incorrect password');
    }

    const tokens = await this.getToken(user.id, user.email);
    await this.updateHashRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async getMe(user: User) {
    return user;
  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
      },
      data: {
        hashRefresh: null,
      },
    });

    return { message: 'Logout successfully!' };
  }

  async refreshToken(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User does not exist.');
    }

    if (!user.hashRefresh) {
      throw new BadRequestException('No refresh token stored.');
    }

    const isRefreshValid = await bcrypt.compare(refreshToken, user.hashRefresh);

    if (!isRefreshValid) {
      throw new BadRequestException('Invalid refresh token.');
    }

    const tokens = await this.getToken(user.id, user.email);
    await this.updateHashRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async getToken(userId: number, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.config.get('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async updateHashRefreshToken(userId: number, refreshToken: string) {
    const hashRefresh = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashRefresh: hashRefresh,
      },
    });
  }
}
