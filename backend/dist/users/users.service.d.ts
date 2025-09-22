import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findOrCreateUser(userId: string): Promise<User>;
    getUserCredits(userId: string): Promise<{
        success: boolean;
        credits: number;
        user_id: string;
    }>;
    updateCredits(userId: string, amount: number): Promise<User>;
    fixUserCredits(userId: string, amount: number): Promise<{
        success: boolean;
        message: string;
        credits: number;
    }>;
    getAllUsers(): Promise<User[]>;
}
