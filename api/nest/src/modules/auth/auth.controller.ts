import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetVerifyDto } from './dto/password-reset-verify.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RegistrationOtpResendDto } from './dto/registration-otp-resend.dto';
import { RegistrationOtpVerifyDto } from './dto/registration-otp-verify.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify registration OTP and create the user' })
  verifyRegistrationOtp(@Body() dto: RegistrationOtpVerifyDto) {
    return this.authService.verifyRegistrationOtp(dto.challengeId, dto.otp);
  }

  @Post('register/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend registration OTP' })
  resendRegistrationOtp(@Body() dto: RegistrationOtpResendDto) {
    return this.authService.resendRegistrationOtp(dto.challengeId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP for password reset' })
  requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password-reset/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for password reset' })
  verifyPasswordResetOtp(@Body() dto: PasswordResetVerifyDto) {
    return this.authService.verifyPasswordResetOtp(dto.email, dto.otp);
  }

  @Post('password-reset/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with verified OTP' })
  resetPassword(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }
}
