import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUserCredits(userId: string): Promise<{
        success: boolean;
        credits: number;
        user_id: string;
    }>;
    fixUserCredits(userId: string, body: {
        amount: number;
    }): Promise<{
        success: boolean;
        message: string;
        credits: number;
    }>;
}
