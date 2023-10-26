import { IsEnum, IsString } from 'class-validator';
import { DocumentType } from '../interfaces/document-type.enum';

export class GeneratePresignedDownloadUrlDto {
  @IsString()
  @IsEnum(DocumentType)
  fileKey: string;
  @IsString()
  fileName: string;
}
