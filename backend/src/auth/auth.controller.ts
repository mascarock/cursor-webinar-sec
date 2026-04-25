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
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { getUserFromRequest, signToken } from './jwt.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('api')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Create account' })
  @ApiResponse({ status: 201, description: 'Account created; sets `token` cookie' })
  @ApiResponse({ status: 400, description: 'Missing data or username taken' })
  async register(
    @Body() body: RegisterDto,
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
  @ApiOperation({ summary: 'Log in' })
  @ApiResponse({ status: 201, description: 'Sets `token` cookie' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: LoginDto,
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
  @ApiOperation({ summary: 'Log out (clears cookie)' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token');
    return { ok: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Current user (from JWT cookie)' })
  @ApiSecurity('access-token')
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  me(@Req() req: Request) {
    const user = getUserFromRequest(req);
    if (!user) {
      throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED);
    }
    return { username: user.username };
  }
}
