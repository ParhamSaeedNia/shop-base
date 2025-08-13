import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LoginDto } from './dto/request/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponse } from './dto/response/auth.response';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Post('signup')
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: AuthResponse,
  })
  async signup(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.signup(createUserDto);
  }

  @ApiOperation({ summary: 'Login with credentials' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }
}
