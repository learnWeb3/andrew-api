import { Injectable } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';
import { IAclReportDocument } from 'src/lib/interfaces/acl-report.interface';
import { v4 as uuid } from 'uuid';

@Injectable()
export class OpensearchService {
  private client: Client;
  private ACL_INDEX = process.env.OPENSEARCH_ACL_INDEX;
  private ACL_REPORT_INDEX = process.env.OPENSEARCH_ACL_REPORT_INDEX;

  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_URL,
    });
  }

  // onModuleInit() {
  // this.getLastReportData(
  //   '1HGBH41JXMN109186',
  //   Date.now() - 24 * 3600 * 1000,
  //   Date.now(),
  // ).then((data) => console.log(JSON.stringify(data, null, 4)));
  // }

  async getAverageDriverBehaviourClassInt(
    vehicleVIN: string,
    start: number,
    end: number,
  ): Promise<number> {
    const body = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              has_parent: {
                parent_type: 'vehicle',
                query: {
                  match: { vehicle: vehicleVIN },
                },
              },
            },
            {
              nested: {
                path: 'report.driving_session',
                query: {
                  range: {
                    'report.driving_session.start': {
                      gte: start,
                      end: end,
                      format: 'epoch_millis',
                    },
                  },
                },
              },
            },
          ],
        },
      },
      aggs: {
        nested_reports: {
          nested: {
            path: 'report.driving_session',
          },
          aggs: {
            average_driver_behaviour: {
              avg: {
                field: 'report.driving_session.driver_behaviour_class_int',
              },
            },
          },
        },
      },
    };

    return await this.client
      .search({
        index: this.ACL_REPORT_INDEX,
        size: 0,
        body,
      })
      .then(
        (response) =>
          response.body.aggregations.nested_reports.average_driver_behaviour
            .value,
      );
  }

  async getLastReportData(
    vehicleVIN: string,
    start: number,
    end: number,
  ): Promise<IAclReportDocument[]> {
    const results: IAclReportDocument[] = [];
    let searchAfter = [];
    let data = await this._getLastReportData(
      vehicleVIN,
      start,
      end,
      searchAfter,
    );

    while (data?.hits?.total?.value !== results.length) {
      results.push(...data.hits.hits.map(({ _source }) => _source));
      searchAfter = data.hits.hits[data.hits.hits.length - 1].sort;
      data = await this._getLastReportData(vehicleVIN, start, end, searchAfter);
    }

    return results;
  }

  async _getLastReportData(
    vehicleVIN: string,
    start: number,
    end: number,
    searchAfter: any[] = [],
    pageSize: number = 10000,
  ) {
    console.log(end, 'end');
    const body = {
      sort: {
        timestamp: { order: 'desc' },
      },
      query: {
        bool: {
          must: [
            {
              has_parent: {
                parent_type: 'vehicle',
                query: {
                  match: { vehicle: vehicleVIN },
                },
              },
            },
            {
              range: {
                timestamp: {
                  lte: end,
                  gte: start,
                  format: 'epoch_millis',
                },
              },
            },
          ],
        },
      },
    };
    if (searchAfter.length) {
      Object.assign(body, { search_after: searchAfter });
    }
    return await this.client
      .search({
        index: this.ACL_INDEX,
        size: pageSize,
        body,
      })
      .then(
        (response) => response.body,
        // .hits.hits
      );
  }
  async registerDeviceReportData(
    vehicleVIN: string,
    data: {
      device: string;
      vehicle: string;
      report: {
        driving_session: {
          start: number;
          end: number;
          driver_behaviour_class: string;
          driver_behaviour_class_int: number;
        };
      };
    },
  ) {
    await this.client.update({
      index: this.ACL_REPORT_INDEX,
      id: uuid(),
      routing: vehicleVIN,
      body: {
        doc: {
          report_to_vehicle: {
            name: 'report',
            parent: vehicleVIN,
          },
          ...data,
        },
        doc_as_upsert: true, // Create the document if it doesn't exist
      },
    });
  }

  async registerDeviceData(
    vehicleVIN: string,
    data: {
      vehicle: string;
      device: string;
      timestamp: number;
      obd_data: {
        fuel_rate: number;
        vehicle_speed: number;
        engine_speed: number;
        relative_accel_pos: number;
      };
    },
  ) {
    await this.client.update({
      index: this.ACL_INDEX,
      id: uuid(),
      routing: vehicleVIN,
      body: {
        doc: {
          data_to_vehicle: {
            name: 'data',
            parent: vehicleVIN,
          },
          ...data,
        },
        doc_as_upsert: true, // Create the document if it doesn't exist
      },
    });
  }

  async updateACLReportsRights(vehicleVIN: string, userIds: string[]) {
    await this.client.update({
      index: this.ACL_REPORT_INDEX,
      id: vehicleVIN,
      routing: 'vehicle',
      body: {
        doc: {
          report_to_vehicle: {
            name: 'vehicle',
          },
          vehicle: vehicleVIN,
          users: userIds,
        },
        doc_as_upsert: true,
      },
    });
  }

  async updateACLRights(vehicleVIN: string, userIds: string[]) {
    await this.client.update({
      index: this.ACL_INDEX,
      id: vehicleVIN,
      routing: 'vehicle',
      body: {
        doc: {
          data_to_vehicle: {
            name: 'vehicle',
          },
          vehicle: vehicleVIN,
          users: userIds,
        },
        doc_as_upsert: true,
      },
    });
  }
}
