import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { getUserFromRequest, signToken } from './jwt.util';

@Controller('api')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body?.username || !body?.password) {
      throw new HttpException('Missing data', HttpStatus.BAD_REQUEST);
    }
    const user = await this.auth.register(body.username, body.password);
    if (!user) {
      throw new HttpException('Username already exists', HttpStatus.BAD_REQUEST);
    }
    const token = signToken({ id: user._id, username: user.username });
    res.cookie('token', token);
    return { ok: true, username: user.username };
  }

  @Post('login')
  async login(
    @Body() body: { username: any; password: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.auth.login(body?.username, body?.password);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const token = signToken({ id: user._id, username: user.username });
    res.cookie('token', token);
    return { ok: true, username: user.username };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { ok: true };
  }

  @Get('me')
  me(@Req() req: Request) {
    const user = getUserFromRequest(req);
    if (!user) {
      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return { username: user.username };
  }
}
