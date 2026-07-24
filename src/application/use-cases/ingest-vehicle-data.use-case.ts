import { Inject, Injectable, Logger } from '@nestjs/common';
import { chunk, mapWithConcurrency } from '../../common/utils/concurrency';
import { AppConfigService } from '../../config/app-config.service';
import { Make, MakeWithVehicleTypes } from '../../domain/entities/make.entity';
import { IngestionError } from '../../domain/errors/domain.errors';
import { MAKE_REPOSITORY, MakeRepository } from '../../domain/ports/make-repository.port';
import {
  VEHICLE_DATA_SOURCE,
  VehicleDataSource,
} from '../../domain/ports/vehicle-data-source.port';
import { IngestionFailure, IngestionSummary } from '../dto/ingestion-summary.dto';

interface BatchResult {
  succeeded: MakeWithVehicleTypes[];
  failures: IngestionFailure[];
}

@Injectable()
export class IngestVehicleDataUseCase {
  private readonly logger = new Logger(IngestVehicleDataUseCase.name);
  private running = false;

  constructor(
    @Inject(VEHICLE_DATA_SOURCE) private readonly dataSource: VehicleDataSource,
    @Inject(MAKE_REPOSITORY) private readonly makeRepository: MakeRepository,
    private readonly config: AppConfigService,
  ) {}

  async execute(): Promise<IngestionSummary> {
    this.acquireRunLock();
    const startedAt = Date.now();

    try {
      const summary = await this.runIngestion(startedAt);
      this.logger.log({ msg: 'Ingestion finished', ...summary, failures: undefined });
      return summary;
    } catch (error) {
      this.logger.error({
        msg: 'Ingestion aborted',
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.running = false;
    }
  }

  private acquireRunLock(): void {
    if (this.running) {
      throw new IngestionError('An ingestion is already in progress');
    }
    this.running = true;
  }

  private async runIngestion(startedAt: number): Promise<IngestionSummary> {
    const { concurrency, makeLimit, batchSize } = this.config.ingestion;
    this.logger.log({ msg: 'Ingestion started', concurrency, makeLimit, batchSize });

    const allMakes = await this.dataSource.getAllMakes();
    const makes = this.applyMakeLimit(allMakes, makeLimit);
    this.logger.log({
      msg: 'Makes discovered',
      totalMakesDiscovered: allMakes.length,
      makesToProcess: makes.length,
    });

    const failures: IngestionFailure[] = [];
    let makesSucceeded = 0;
    let vehicleTypesLinked = 0;

    for (const [batchIndex, batch] of chunk(makes, batchSize).entries()) {
      const result = await this.processBatch(batch, concurrency);
      await this.makeRepository.upsertMany(result.succeeded);

      failures.push(...result.failures);
      makesSucceeded += result.succeeded.length;
      vehicleTypesLinked += this.countVehicleTypes(result.succeeded);

      this.logger.log({
        msg: 'Batch persisted',
        batch: batchIndex + 1,
        batchSize: batch.length,
        succeeded: result.succeeded.length,
        failed: result.failures.length,
      });
    }

    return {
      totalMakesDiscovered: allMakes.length,
      makesProcessed: makes.length,
      makesSucceeded,
      makesFailed: failures.length,
      vehicleTypesLinked,
      durationMs: Date.now() - startedAt,
      failures,
    };
  }

  private applyMakeLimit(makes: Make[], limit: number): Make[] {
    return limit > 0 ? makes.slice(0, limit) : makes;
  }

  private async processBatch(batch: Make[], concurrency: number): Promise<BatchResult> {
    const results = await mapWithConcurrency(batch, concurrency, (make) =>
      this.enrichMakeWithVehicleTypes(make),
    );

    const succeeded: MakeWithVehicleTypes[] = [];
    const failures: IngestionFailure[] = [];
    for (const { item, result, error } of results) {
      if (result) {
        succeeded.push(result);
      } else {
        failures.push(this.toFailure(item, error));
      }
    }
    return { succeeded, failures };
  }

  private async enrichMakeWithVehicleTypes(make: Make): Promise<MakeWithVehicleTypes> {
    const vehicleTypes = await this.dataSource.getVehicleTypesForMake(make.makeId);
    return { ...make, vehicleTypes };
  }

  private toFailure(make: Make, error: unknown): IngestionFailure {
    const reason = error instanceof Error ? error.message : String(error);
    this.logger.warn({ msg: 'Failed to fetch vehicle types', makeId: make.makeId, reason });
    return { makeId: make.makeId, makeName: make.makeName, reason };
  }

  private countVehicleTypes(makes: MakeWithVehicleTypes[]): number {
    return makes.reduce((sum, make) => sum + make.vehicleTypes.length, 0);
  }
}
