import { userRepository } from '../repositories/userRepository';
import { CreateUserDto } from '../types/user';

export const userService = {
  getAll() {
    return userRepository.findAll();
  },

  getById(id: string) {
    return userRepository.findById(id);
  },

  create(data: CreateUserDto) {
    return userRepository.create(data);
  },

  update(id: string, data: CreateUserDto) {
    return userRepository.update(id, data);
  },

  delete(id: string) {
    return userRepository.delete(id);
  },
};
