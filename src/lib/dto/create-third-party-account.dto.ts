import { IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateThirdPartyAccountDto {
  @IsNotEmpty()
  firstName: string;
  @IsNotEmpty()
  lastName: string;
  @IsNotEmpty()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsBoolean()
  insurer: boolean;
}
