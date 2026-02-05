export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
}
