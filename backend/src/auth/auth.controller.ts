import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { JwtAuthAccessGuard, JwtAuthRefreshGuard } from 'src/common/guards';
import { getUser } from 'src/common/decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: AuthDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: AuthDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthAccessGuard)
  getMe(@getUser() user) {
    return this.authService.getMe(user);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthAccessGuard)
  @Post('logout')
  logout(@getUser('userId') userId) {
    return this.authService.logout(userId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthRefreshGuard)
  @Post('refresh')
  refresh(
    @getUser('userId') userId,
    @getUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshToken(userId, refreshToken);
  }
}
