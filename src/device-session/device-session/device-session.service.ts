import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession } from './device-session.schemas';
import { Model } from 'mongoose';

@Injectable()
export class DeviceSessionService {
  constructor(
    @InjectModel(DeviceSession.name)
    private readonly deviceSessionModel: Model<DeviceSession>,
  ) {}

  async handleSessionStart(deviceId: string) {
    const activeSessionExists = await this.deviceSessionModel.findOne({
      device: deviceId,
      end: null,
    });
    if (activeSessionExists) {
      await this.handleSessionEnd(deviceId);
    }
    const date = new Date();
    const newSession = new this.deviceSessionModel({
      start: date,
      end: null,
      device: deviceId,
    });
    await newSession.save();
  }

  async handleSessionEnd(deviceId: string) {
    const date = new Date();
    const lastDeviceSession = await this.deviceSessionModel.findOne({
      device: deviceId,
      end: null,
    });
    lastDeviceSession.end = date;
    await lastDeviceSession.save();
  }
}
