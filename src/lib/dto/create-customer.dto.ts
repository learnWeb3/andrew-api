import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsUUID('4')
  authorizationServerUserId?: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;
}
