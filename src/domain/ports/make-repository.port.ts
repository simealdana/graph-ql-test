import { MakeWithVehicleTypes } from '../entities/make.entity';

export const MAKE_REPOSITORY = Symbol('MAKE_REPOSITORY');

export interface FindMakesOptions {
  limit: number;
  offset: number;
  search?: string;
}

export interface PaginatedMakes {
  items: MakeWithVehicleTypes[];
  total: number;
}

export interface MakeRepository {
  upsertMany(makes: MakeWithVehicleTypes[]): Promise<void>;
  findMany(options: FindMakesOptions): Promise<PaginatedMakes>;
  findById(makeId: number): Promise<MakeWithVehicleTypes | null>;
  count(): Promise<number>;
}
