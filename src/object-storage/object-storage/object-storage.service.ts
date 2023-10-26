import { Injectable } from '@nestjs/common';
import { Storage, GetSignedUrlConfig } from '@google-cloud/storage';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ObjectStorageService {
  public storage: Storage;
  private bucketName: string;

  constructor() {
    this.storage = new Storage({
      projectId: 'sinuous-athlete-403218',
      credentials: {
        client_email: process.env.GOOGLE_STORAGE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_STORAGE_PRIVATE_KEY,
      },
    });
    this.bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME;
  }

  async checkExists(fileKey: string): Promise<boolean> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileKey);

    try {
      const [exists] = await file.exists();
      return exists;
    } catch (e) {
      console.error('Error:', e);
      return false;
    }
  }

  async generateV4UploadSignedUrl(
    fileKey: string,
    fileName: string = 'test.txt',
    expires: number = Date.now() + 15 * 60 * 1000,
    contentType: string = 'image/jpg',
  ): Promise<{
    url: string;
    expires: number;
    fileKey: string;
    fileName: string;
  }> {
    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'write',
      expires,
      contentType,
    };

    // Get a v4 signed URL for uploading file
    fileName = uuid() + '_' + fileName;
    const filePath = join(fileKey, fileName);
    const url = await this.storage
      .bucket(this.bucketName)
      .file(filePath)
      .getSignedUrl(options)
      .then((value) => value[0]);

    return {
      url,
      expires,
      fileName,
      fileKey,
    };
  }

  async generateV4DownloadSignedUrl(
    fileKey: string,
    fileName: string = 'test.txt',
    expires: number = Date.now() + 15 * 60 * 1000,
  ): Promise<{ url: string; expires: number }> {
    const options: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires,
    };

    // Get a v4 signed URL for downloading a file
    const url = await this.storage
      .bucket(this.bucketName)
      .file(join(fileKey, fileName))
      .getSignedUrl(options)
      .then((value) => value[0]);

    return {
      url,
      expires,
    };
  }
}
