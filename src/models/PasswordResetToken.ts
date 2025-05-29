import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

// Define attributes
interface PasswordResetTokenAttributes {
  id: number;
  user_id: number; 
  token: string;
  expires_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PasswordResetTokenCreationAttributes extends Optional<PasswordResetTokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PasswordResetTokenInstance extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes> {
  dataValues: PasswordResetTokenAttributes;
}

const PasswordResetToken = sequelize.define<PasswordResetTokenInstance>(
  'PasswordResetToken',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'password_reset_tokens',
    timestamps: true,
  }
);

// Define associations
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(PasswordResetToken, { foreignKey: 'user_id' });

export default PasswordResetToken;