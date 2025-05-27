import { Model, DataTypes, Optional, Sequelize, ModelStatic } from 'sequelize';
import { sequelize } from '../config/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Define User attributes
interface UserAttributes {
  id: string; // UUID as string
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define creation attributes (id, createdAt, updatedAt are optional)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Declare custom methods on Model prototype
declare global {
  interface Function {
    prototype: any;
  }
}

// Define User instance with custom methods
export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {
  matchPassword(enteredPassword: string): Promise<boolean>;
  createResetToken(): Promise<string>;
  updatePassword(newPassword: string): Promise<void>;
}

// Extend Model interface to include custom methods
declare module 'sequelize' {
  interface Model {
    id: string;
    password: string;
    matchPassword(enteredPassword: string): Promise<boolean>;
    createResetToken(): Promise<string>;
    updatePassword(newPassword: string): Promise<void>;
  }
}

// Define User model type with static methods
interface UserModel extends ModelStatic<UserInstance> {
  findByEmail(email: string): Promise<UserInstance | null>;
  findResetToken(token: string): Promise<{ user_id: string } | null>;
  deleteResetToken(token: string): Promise<void>;
}

// Use Sequelize.QueryTypes from the import, not from the instance
const { QueryTypes } = require('sequelize');

// Define User model
const User = sequelize.define<UserInstance>(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user: UserInstance) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: UserInstance) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
) as unknown as UserModel;

// Instance method to compare passwords
User.prototype.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Static method to find user by email
User.findByEmail = async function (email: string): Promise<UserInstance | null> {
  try {
    const user = await User.findOne({ where: { email } });
    return user as UserInstance | null;
  } catch (error: any) {
    throw new Error(`Error finding user: ${error.message}`);
  }
};

// Instance method to create a reset token
User.prototype.createResetToken = async function (): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  try {
    await sequelize.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:userId, :token, :expiresAt)',
      {
        replacements: { userId: this.id, token: hashedToken, expiresAt },
        type: QueryTypes.INSERT,
      }
    );
    return token;
  } catch (error: any) {
    throw new Error(`Error creating reset token: ${error.message}`);
  }
};

// Static method to find a reset token
User.findResetToken = async function (token: string): Promise<{ user_id: string } | null> {
  try {
    const results = (await sequelize.query(
      'SELECT user_id, token FROM password_reset_tokens WHERE expires_at > CURRENT_TIMESTAMP',
      { type: QueryTypes.SELECT }
    )) as unknown as any[];

    for (const row of results) {
      const isMatch = await bcrypt.compare(token, row.token);
      if (isMatch) {
        return { user_id: row.user_id };
      }
    }
    return null;
  } catch (error: any) {
    throw new Error(`Error finding reset token: ${error.message}`);
  }
};

// Instance method to update password
User.prototype.updatePassword = async function (newPassword: string): Promise<void> {
  try {
    this.password = newPassword; // Sequelize hook will hash it
    await this.save();
  } catch (error: any) {
    throw new Error(`Error updating password: ${error.message}`);
  }
};

// Static method to delete reset token
User.deleteResetToken = async function (token: string): Promise<void> {
  const hashedToken = await bcrypt.hash(token, 10);
  try {
    await sequelize.query('DELETE FROM password_reset_tokens WHERE token = :token', {
      replacements: { token: hashedToken },
      type: QueryTypes.DELETE,
    });
  } catch (error: any) {
    throw new Error(`Error deleting reset token: ${error.message}`);
  }
};

export default User;