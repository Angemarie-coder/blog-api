import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import bcrypt from "bcrypt";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  async findByName(name: string): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .getMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async update(id: number, updatedData: Partial<User>): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    
    // If password is being updated, hash it
    if (updatedData.password) {
      updatedData.password = await bcrypt.hash(updatedData.password, 10);
    }
    
    Object.assign(user, updatedData);
    return await this.userRepository.save(user);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }
}