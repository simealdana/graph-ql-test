import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MakeWithVehicleTypes } from '../../domain/entities/make.entity';
import { PersistenceError } from '../../domain/errors/domain.errors';
import {
  FindMakesOptions,
  MakeRepository,
  PaginatedMakes,
} from '../../domain/ports/make-repository.port';
import { PrismaService } from './prisma.service';

type MakeWithTypesRow = Prisma.MakeGetPayload<{
  include: { vehicleTypes: { include: { vehicleType: true } } };
}>;

@Injectable()
export class PrismaMakeRepository implements MakeRepository {
  private readonly logger = new Logger(PrismaMakeRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(makes: MakeWithVehicleTypes[]): Promise<void> {
    if (makes.length === 0) {
      return;
    }

    try {
      await this.prisma.$transaction([
        ...this.buildVehicleTypeUpserts(makes),
        ...this.buildMakeUpserts(makes),
        ...this.buildLinkReplacements(makes),
      ]);
    } catch (error) {
      this.logger.error({
        msg: 'Failed to persist makes batch',
        batchSize: makes.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new PersistenceError(`Failed to persist batch of ${makes.length} makes`, error);
    }
  }

  private buildVehicleTypeUpserts(makes: MakeWithVehicleTypes[]) {
    const distinctTypes = new Map<number, string>();
    for (const make of makes) {
      for (const type of make.vehicleTypes) {
        distinctTypes.set(type.typeId, type.typeName);
      }
    }
    return [...distinctTypes.entries()].map(([id, name]) =>
      this.prisma.vehicleType.upsert({
        where: { id },
        create: { id, name },
        update: { name },
      }),
    );
  }

  private buildMakeUpserts(makes: MakeWithVehicleTypes[]) {
    return makes.map((make) =>
      this.prisma.make.upsert({
        where: { id: make.makeId },
        create: { id: make.makeId, name: make.makeName },
        update: { name: make.makeName },
      }),
    );
  }

  private buildLinkReplacements(makes: MakeWithVehicleTypes[]) {
    return [
      this.prisma.makeVehicleType.deleteMany({
        where: { makeId: { in: makes.map((make) => make.makeId) } },
      }),
      this.prisma.makeVehicleType.createMany({
        data: makes.flatMap((make) =>
          make.vehicleTypes.map((type) => ({
            makeId: make.makeId,
            vehicleTypeId: type.typeId,
          })),
        ),
        skipDuplicates: true,
      }),
    ];
  }

  async findMany(options: FindMakesOptions): Promise<PaginatedMakes> {
    const where: Prisma.MakeWhereInput = options.search
      ? { name: { contains: options.search, mode: 'insensitive' } }
      : {};

    try {
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.make.findMany({
          where,
          skip: options.offset,
          take: options.limit,
          orderBy: { name: 'asc' },
          include: { vehicleTypes: { include: { vehicleType: true } } },
        }),
        this.prisma.make.count({ where }),
      ]);
      return { items: rows.map((row) => this.toDomain(row)), total };
    } catch (error) {
      throw new PersistenceError('Failed to query makes', error);
    }
  }

  async findById(makeId: number): Promise<MakeWithVehicleTypes | null> {
    try {
      const row = await this.prisma.make.findUnique({
        where: { id: makeId },
        include: { vehicleTypes: { include: { vehicleType: true } } },
      });
      return row ? this.toDomain(row) : null;
    } catch (error) {
      throw new PersistenceError(`Failed to query make ${makeId}`, error);
    }
  }

  async count(): Promise<number> {
    try {
      return await this.prisma.make.count();
    } catch (error) {
      throw new PersistenceError('Failed to count makes', error);
    }
  }

  private toDomain(row: MakeWithTypesRow): MakeWithVehicleTypes {
    return {
      makeId: row.id,
      makeName: row.name,
      vehicleTypes: row.vehicleTypes.map((link) => ({
        typeId: link.vehicleType.id,
        typeName: link.vehicleType.name,
      })),
    };
  }
}
