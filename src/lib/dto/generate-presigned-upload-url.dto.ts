import { IsEnum, IsString } from 'class-validator';
import { DocumentType } from '../interfaces/document-type.enum';
import { DocumentMimeType } from '../interfaces/document-mimetype.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePresignedUploadUrlDto {
  @ApiProperty({ enum: DocumentType })
  @IsString()
  @IsEnum(DocumentType)
  fileKey: DocumentType;
  @ApiProperty()
  @IsString()
  fileName: string;
  @ApiProperty({ enum: DocumentMimeType })
  @IsEnum(DocumentMimeType)
  mimetype: string;
}
