import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { GraphqlExceptionFilter } from './graphql/graphql-exception.filter';
import { IngestionResolver } from './graphql/resolvers/ingestion.resolver';
import { MakeResolver } from './graphql/resolvers/make.resolver';
import { HealthController } from './health/health.controller';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [HealthController],
  providers: [
    MakeResolver,
    IngestionResolver,
    { provide: APP_FILTER, useClass: GraphqlExceptionFilter },
  ],
})
export class PresentationModule {}
