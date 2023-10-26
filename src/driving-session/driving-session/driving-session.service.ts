import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DrivingSession } from './device-session.schemas';
import { Model } from 'mongoose';

@Injectable()
export class DrivingSessionService {
  constructor(
    @InjectModel(DrivingSession.name)
    private readonly drivingSessionModel: Model<DrivingSession>,
  ) {}

  async handleSessionStart(deviceId: string) {
    const activeSessionExists = await this.drivingSessionModel.findOne({
      device: deviceId,
      end: null,
    });
    if (activeSessionExists) {
      await this.handleSessionEnd(deviceId);
    }
    const date = new Date();
    const newSession = new this.drivingSessionModel({
      start: date,
      end: null,
      device: deviceId,
    });
    await newSession.save();
  }

  async handleSessionEnd(deviceId: string) {
    const date = new Date();
    const latDrivingSession = await this.drivingSessionModel.findOne({
      device: deviceId,
      end: null,
    });
    latDrivingSession.end = date;
    await latDrivingSession.save();
  }

  async findLastSession(deviceId: string) {
    const latDrivingSession = await this.drivingSessionModel
      .findOne({
        device: deviceId,
      })
      .sort({ end: -1 })
      .limit(1);
    return latDrivingSession;
  }
}
