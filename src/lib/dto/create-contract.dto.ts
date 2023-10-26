import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class CreateContractDto {
  @IsNotEmpty()
  customer: string;
  @IsNotEmpty()
  @IsString()
  ecommerceProduct: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(EcommerceGateway)
  ecommerceGateway: EcommerceGateway;
}
