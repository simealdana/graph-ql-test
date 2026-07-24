import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { GetMakeByIdUseCase } from './use-cases/get-make-by-id.use-case';
import { GetMakesUseCase } from './use-cases/get-makes.use-case';
import { IngestVehicleDataUseCase } from './use-cases/ingest-vehicle-data.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [IngestVehicleDataUseCase, GetMakesUseCase, GetMakeByIdUseCase],
  exports: [IngestVehicleDataUseCase, GetMakesUseCase, GetMakeByIdUseCase],
})
export class ApplicationModule {}
