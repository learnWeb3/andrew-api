import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty()
  @IsNotEmpty()
  customer: string;
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ecommerceProduct: string;

  @ApiProperty({ enum: EcommerceGateway })
  @IsNotEmpty()
  @IsString()
  @IsEnum(EcommerceGateway)
  ecommerceGateway: EcommerceGateway;
}
