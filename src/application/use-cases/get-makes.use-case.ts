import { Inject, Injectable } from '@nestjs/common';
import {
  FindMakesOptions,
  MAKE_REPOSITORY,
  MakeRepository,
  PaginatedMakes,
} from '../../domain/ports/make-repository.port';

@Injectable()
export class GetMakesUseCase {
  constructor(@Inject(MAKE_REPOSITORY) private readonly makeRepository: MakeRepository) {}

  async execute(options: FindMakesOptions): Promise<PaginatedMakes> {
    return this.makeRepository.findMany(options);
  }
}
