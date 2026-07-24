import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { IngestVehicleDataUseCase } from '../../application/use-cases/ingest-vehicle-data.use-case';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class IngestionScheduler implements OnModuleInit {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly ingestVehicleData: IngestVehicleDataUseCase,
  ) {}

  onModuleInit(): void {
    const { cronEnabled, cronExpression } = this.config.ingestion;
    if (!cronEnabled) {
      this.logger.log({ msg: 'Scheduled ingestion disabled' });
      return;
    }

    const job = new CronJob(cronExpression, () => {
      this.logger.log({ msg: 'Scheduled ingestion triggered', cronExpression });
      this.ingestVehicleData.execute().catch((error: unknown) => {
        this.logger.error({
          msg: 'Scheduled ingestion failed',
          error: error instanceof Error ? error.message : String(error),
        });
      });
    });

    this.schedulerRegistry.addCronJob('ingestion', job);
    job.start();
    this.logger.log({ msg: 'Scheduled ingestion enabled', cronExpression });
  }
}
