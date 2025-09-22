import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOrCreateUser(userId: string): Promise<User> {
    let user = await this.usersRepository.findOne({ where: { user_id: userId } });

    if (!user) {
      user = this.usersRepository.create({
        user_id: userId,
        credits: 0,
      });
      await this.usersRepository.save(user);
    }

    return user;
  }

  async getUserCredits(userId: string): Promise<{ success: boolean; credits: number; user_id: string }> {
    try {
      const user = await this.findOrCreateUser(userId);
      return {
        success: true,
        credits: Number(user.credits),
        user_id: userId
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async updateCredits(userId: string, amount: number): Promise<User> {
    const user = await this.findOrCreateUser(userId);
    user.credits = Number(user.credits) + amount;
    return await this.usersRepository.save(user);
  }

  async fixUserCredits(userId: string, amount: number): Promise<{ success: boolean; message: string; credits: number }> {
    try {
      const user = await this.findOrCreateUser(userId);
      user.credits = amount;
      await this.usersRepository.save(user);

      return {
        success: true,
        message: `Credits updated to ${amount} for user ${userId}`,
        credits: amount
      };
    } catch (error) {
      throw new Error('Database error');
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.usersRepository.find();
  }
}