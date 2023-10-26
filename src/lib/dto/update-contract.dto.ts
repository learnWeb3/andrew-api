import { PartialType } from '@nestjs/mapped-types';
import { CreateContractDto } from './create-contract.dto';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { ContractStatus } from '../interfaces/contract-status.enum';

export class UpdateContractDto extends PartialType(CreateContractDto) {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @IsEnum(ContractStatus)
  status: ContractStatus;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Matches(/^contract\/contract\/.*/, {
    message:
      'Must be a valid object-storage key string in the form of contract/contract/<filename>',
  })
  contractDocURL: string;
}
