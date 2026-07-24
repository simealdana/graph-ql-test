import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { GetMakeByIdUseCase } from '../../../application/use-cases/get-make-by-id.use-case';
import { GetMakesUseCase } from '../../../application/use-cases/get-makes.use-case';
import { MakesArgs } from '../args/makes.args';
import { MakeModel, PaginatedMakesModel } from '../models/make.model';

@Resolver(() => MakeModel)
export class MakeResolver {
  constructor(
    private readonly getMakes: GetMakesUseCase,
    private readonly getMakeById: GetMakeByIdUseCase,
  ) {}

  @Query(() => PaginatedMakesModel, {
    name: 'makes',
    description: 'List ingested vehicle makes with their vehicle types (paginated, searchable)',
  })
  async makes(@Args() args: MakesArgs): Promise<PaginatedMakesModel> {
    const { items, total } = await this.getMakes.execute({
      limit: args.limit,
      offset: args.offset,
      search: args.search,
    });
    return { items, total, limit: args.limit, offset: args.offset };
  }

  @Query(() => MakeModel, {
    name: 'make',
    nullable: true,
    description: 'Fetch a single make by its NHTSA make ID',
  })
  async make(@Args('makeId', { type: () => Int }) makeId: number): Promise<MakeModel | null> {
    return this.getMakeById.execute(makeId);
  }
}
