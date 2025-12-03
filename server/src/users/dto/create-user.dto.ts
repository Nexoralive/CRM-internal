import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  managerId?: string;
  websiteId?: string;
  panels?: string[]; // Array of panel names the user has access to
}
