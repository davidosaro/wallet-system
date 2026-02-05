import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { UserAttributes, CreateUserDto } from '../types/user';

export const User = sequelize.define<Model<UserAttributes, CreateUserDto>>(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: 'users',
    updatedAt: false,
  }
);
