import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  KeycloakAuthGuard,
  KeycloakAvailableRoles,
  KeycloakRoles,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import { GeneratePresignedDownloadUrlDto } from 'src/lib/dto/generate-presigned-download-url.dto';
import { GeneratePresignedUploadUrlDto } from 'src/lib/dto/generate-presigned-upload-url.dto';
import { RectrictObjectStorageDownloadUrlGuard } from 'src/lib/guards/restrict-object-storage-download-url.guard';
import { ObjectStorageService } from 'src/object-storage/object-storage/object-storage.service';

@UseGuards(KeycloakAuthGuard)
@ApiTags('object-storage')
@Controller('api/object-storage')
export class ObjectStorageController {
  constructor(private readonly objectStorageService: ObjectStorageService) {}

  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Post('upload')
  generatePresignedUploadUrl(
    @Body() generatePresignedUploadUrlDto: GeneratePresignedUploadUrlDto,
  ) {
    return this.objectStorageService.generateV4UploadSignedUrl(
      generatePresignedUploadUrlDto.fileKey,
      generatePresignedUploadUrlDto.fileName,
      Date.now() + 15 * 60 * 1000,
      generatePresignedUploadUrlDto.mimetype,
    );
  }

  @UseGuards(RectrictObjectStorageDownloadUrlGuard)
  @KeycloakRoles([
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.USER,
  ])
  @Post('download')
  generatePresignedDownloadUrl(
    @Body() generatePresignedDownloadUrlDto: GeneratePresignedDownloadUrlDto,
  ) {
    return this.objectStorageService.generateV4DownloadSignedUrl(
      generatePresignedDownloadUrlDto.fileKey,
      generatePresignedDownloadUrlDto.fileName,
    );
  }
}
