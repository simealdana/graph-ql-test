import { MakeWithVehicleTypes } from '../src/domain/entities/make.entity';
import {
  FindMakesOptions,
  MakeRepository,
  PaginatedMakes,
} from '../src/domain/ports/make-repository.port';

export class InMemoryMakeRepository implements MakeRepository {
  private readonly makes = new Map<number, MakeWithVehicleTypes>();

  upsertMany(makes: MakeWithVehicleTypes[]): Promise<void> {
    for (const make of makes) {
      this.makes.set(make.makeId, make);
    }
    return Promise.resolve();
  }

  findMany(options: FindMakesOptions): Promise<PaginatedMakes> {
    const search = options.search?.toLowerCase();
    const filtered = [...this.makes.values()]
      .filter((make) => !search || make.makeName.toLowerCase().includes(search))
      .sort((a, b) => a.makeName.localeCompare(b.makeName));

    return Promise.resolve({
      items: filtered.slice(options.offset, options.offset + options.limit),
      total: filtered.length,
    });
  }

  findById(makeId: number): Promise<MakeWithVehicleTypes | null> {
    return Promise.resolve(this.makes.get(makeId) ?? null);
  }

  count(): Promise<number> {
    return Promise.resolve(this.makes.size);
  }
}
