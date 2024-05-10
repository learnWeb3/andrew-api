import { IsEnum, IsString } from 'class-validator';
import { DocumentType } from '../interfaces/document-type.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePresignedDownloadUrlDto {
  @ApiProperty({ enum: DocumentType })
  @IsString()
  @IsEnum(DocumentType)
  fileKey: string;
  @ApiProperty()
  @IsString()
  fileName: string;
}
