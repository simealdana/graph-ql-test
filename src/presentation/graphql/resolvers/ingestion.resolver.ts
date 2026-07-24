import { Mutation, Resolver } from '@nestjs/graphql';
import { IngestVehicleDataUseCase } from '../../../application/use-cases/ingest-vehicle-data.use-case';
import { IngestionResultModel } from '../models/ingestion-result.model';

@Resolver()
export class IngestionResolver {
  constructor(private readonly ingestVehicleData: IngestVehicleDataUseCase) {}

  @Mutation(() => IngestionResultModel, {
    name: 'triggerIngestion',
    description:
      'Fetches all makes and their vehicle types from the NHTSA API, transforms the XML to JSON and persists the result. Idempotent: re-running updates existing records.',
  })
  async triggerIngestion(): Promise<IngestionResultModel> {
    return this.ingestVehicleData.execute();
  }
}
