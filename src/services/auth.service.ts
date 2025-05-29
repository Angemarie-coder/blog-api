import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import bcrypt from "bcrypt";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.password) {
      throw new Error("Password is required");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    userData.password = hashedPassword;

    // Create and save user
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async login(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) return null;

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return null;

    return user;
  }
}