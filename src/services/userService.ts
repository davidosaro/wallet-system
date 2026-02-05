import { userRepository } from '../repositories/userRepository';
import { CreateUserDto } from '../types/user';

export const userService = {
  getAll() {
    return userRepository.findAll();
  },

  getById(id: number) {
    return userRepository.findById(id);
  },

  create(data: CreateUserDto) {
    return userRepository.create(data);
  },

  update(id: number, data: CreateUserDto) {
    return userRepository.update(id, data);
  },

  delete(id: number) {
    return userRepository.delete(id);
  },
};
