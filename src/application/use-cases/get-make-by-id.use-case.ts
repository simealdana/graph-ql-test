import { Inject, Injectable } from '@nestjs/common';
import { MakeWithVehicleTypes } from '../../domain/entities/make.entity';
import { MAKE_REPOSITORY, MakeRepository } from '../../domain/ports/make-repository.port';

@Injectable()
export class GetMakeByIdUseCase {
  constructor(@Inject(MAKE_REPOSITORY) private readonly makeRepository: MakeRepository) {}

  async execute(makeId: number): Promise<MakeWithVehicleTypes | null> {
    return this.makeRepository.findById(makeId);
  }
}
