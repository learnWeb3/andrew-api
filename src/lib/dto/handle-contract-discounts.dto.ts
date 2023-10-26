import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class HandleContractDiscountsDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1612134000000)
  start: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1612134000000)
  end: number;
}
