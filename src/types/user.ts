export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
}
