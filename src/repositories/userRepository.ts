import { User } from '../models/User';
import { CreateUserDto } from '../types/user';

export const userRepository = {
  async findAll() {
    return User.findAll({ order: [['createdAt', 'ASC']] });
  },

  async findById(id: string) {
    return User.findByPk(id);
  },

  async create(data: CreateUserDto) {
    return User.create(data);
  },

  async update(id: string, data: CreateUserDto) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  },

  async delete(id: string) {
    const deleted = await User.destroy({ where: { id } });
    return deleted > 0;
  },
};
