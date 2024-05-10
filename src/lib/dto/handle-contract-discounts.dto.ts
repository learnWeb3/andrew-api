import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class HandleContractDiscountsDto {
  @ApiProperty({ minimum: 1612134000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1612134000000)
  start: number;

  @ApiProperty({ minimum: 1612134000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1612134000000)
  end: number;
}
