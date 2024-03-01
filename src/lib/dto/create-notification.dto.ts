import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  sender?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  receivers?: string[];
  @IsOptional()
  data: any;
}
