import { Module } from '@nestjs/common';
import { MAKE_REPOSITORY } from '../domain/ports/make-repository.port';
import { VEHICLE_DATA_SOURCE } from '../domain/ports/vehicle-data-source.port';
import { NhtsaApiClient } from './nhtsa/nhtsa-api.client';
import { NhtsaXmlMapper } from './nhtsa/nhtsa-xml.mapper';
import { PrismaMakeRepository } from './persistence/prisma-make.repository';
import { PrismaService } from './persistence/prisma.service';

@Module({
  providers: [
    PrismaService,
    NhtsaXmlMapper,
    { provide: VEHICLE_DATA_SOURCE, useClass: NhtsaApiClient },
    { provide: MAKE_REPOSITORY, useClass: PrismaMakeRepository },
  ],
  exports: [VEHICLE_DATA_SOURCE, MAKE_REPOSITORY, PrismaService],
})
export class InfrastructureModule {}
