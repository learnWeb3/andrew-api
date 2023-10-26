import { IsEnum, IsString } from 'class-validator';
import { DocumentType } from '../interfaces/document-type.enum';
import { DocumentMimeType } from '../interfaces/document-mimetype.enum';

export class GeneratePresignedUploadUrlDto {
  @IsString()
  @IsEnum(DocumentType)
  fileKey: DocumentType;
  @IsString()
  fileName: string;
  @IsEnum(DocumentMimeType)
  mimetype: string;
}
