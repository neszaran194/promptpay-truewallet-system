import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user-credits/:userId')
  async getUserCredits(@Param('userId') userId: string) {
    try {
      return await this.usersService.getUserCredits(userId);
    } catch (error) {
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('fix-credits/:userId')
  async fixUserCredits(
    @Param('userId') userId: string,
    @Body() body: { amount: number }
  ) {
    const { amount } = body;

    if (!amount) {
      throw new HttpException(
        { success: false, error: 'Amount required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.usersService.fixUserCredits(userId, amount);
    } catch (error) {
      throw new HttpException(
        { success: false, error: 'Database error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}