import { AppConfigService } from '../../config/app-config.service';
import { Make } from '../../domain/entities/make.entity';
import { ExternalApiError, IngestionError } from '../../domain/errors/domain.errors';
import { MakeRepository } from '../../domain/ports/make-repository.port';
import { VehicleDataSource } from '../../domain/ports/vehicle-data-source.port';
import { IngestVehicleDataUseCase } from './ingest-vehicle-data.use-case';

const MAKES: Make[] = [
  { makeId: 1, makeName: 'MAKE A' },
  { makeId: 2, makeName: 'MAKE B' },
  { makeId: 3, makeName: 'MAKE C' },
];

function configStub(overrides: Partial<AppConfigService['ingestion']> = {}): AppConfigService {
  return {
    ingestion: {
      concurrency: 2,
      makeLimit: 0,
      batchSize: 2,
      cronEnabled: false,
      cronExpression: '0 3 * * *',
      ...overrides,
    },
  } as unknown as AppConfigService;
}

describe('IngestVehicleDataUseCase', () => {
  let dataSource: jest.Mocked<VehicleDataSource>;
  let repository: jest.Mocked<MakeRepository>;

  beforeEach(() => {
    dataSource = {
      getAllMakes: jest.fn().mockResolvedValue(MAKES),
      getVehicleTypesForMake: jest
        .fn()
        .mockImplementation((makeId: number) =>
          Promise.resolve([{ typeId: makeId * 10, typeName: `Type ${makeId}` }]),
        ),
    };
    repository = {
      upsertMany: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
    };
  });

  it('ingests every make with its vehicle types and reports a summary', async () => {
    const useCase = new IngestVehicleDataUseCase(dataSource, repository, configStub());

    const summary = await useCase.execute();

    expect(summary).toMatchObject({
      totalMakesDiscovered: 3,
      makesProcessed: 3,
      makesSucceeded: 3,
      makesFailed: 0,
      vehicleTypesLinked: 3,
      failures: [],
    });
    expect(dataSource.getVehicleTypesForMake).toHaveBeenCalledTimes(3);

    const persisted = repository.upsertMany.mock.calls.flatMap(([batch]) => batch);
    expect(persisted).toEqual([
      { makeId: 1, makeName: 'MAKE A', vehicleTypes: [{ typeId: 10, typeName: 'Type 1' }] },
      { makeId: 2, makeName: 'MAKE B', vehicleTypes: [{ typeId: 20, typeName: 'Type 2' }] },
      { makeId: 3, makeName: 'MAKE C', vehicleTypes: [{ typeId: 30, typeName: 'Type 3' }] },
    ]);
  });

  it('persists in batches of the configured size', async () => {
    const useCase = new IngestVehicleDataUseCase(dataSource, repository, configStub());

    await useCase.execute();

    expect(repository.upsertMany).toHaveBeenCalledTimes(2);
    expect(repository.upsertMany.mock.calls[0][0].length).toBe(2);
    expect(repository.upsertMany.mock.calls[1][0].length).toBe(1);
  });

  it('respects the configured make limit', async () => {
    const useCase = new IngestVehicleDataUseCase(
      dataSource,
      repository,
      configStub({ makeLimit: 1 }),
    );

    const summary = await useCase.execute();

    expect(summary.totalMakesDiscovered).toBe(3);
    expect(summary.makesProcessed).toBe(1);
    expect(dataSource.getVehicleTypesForMake).toHaveBeenCalledTimes(1);
  });

  it('isolates per-make failures instead of aborting the whole run', async () => {
    dataSource.getVehicleTypesForMake.mockImplementation((makeId: number) =>
      makeId === 2
        ? Promise.reject(new ExternalApiError('NHTSA API responded with HTTP 503'))
        : Promise.resolve([{ typeId: makeId * 10, typeName: `Type ${makeId}` }]),
    );
    const useCase = new IngestVehicleDataUseCase(dataSource, repository, configStub());

    const summary = await useCase.execute();

    expect(summary.makesSucceeded).toBe(2);
    expect(summary.makesFailed).toBe(1);
    expect(summary.failures).toEqual([
      { makeId: 2, makeName: 'MAKE B', reason: 'NHTSA API responded with HTTP 503' },
    ]);
  });

  it('fails fast when the makes listing cannot be fetched', async () => {
    dataSource.getAllMakes.mockRejectedValue(new ExternalApiError('network down'));
    const useCase = new IngestVehicleDataUseCase(dataSource, repository, configStub());

    await expect(useCase.execute()).rejects.toThrow(ExternalApiError);
    expect(repository.upsertMany).not.toHaveBeenCalled();
  });

  it('rejects concurrent ingestion runs', async () => {
    let release!: (makes: Make[]) => void;
    dataSource.getAllMakes.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const useCase = new IngestVehicleDataUseCase(dataSource, repository, configStub());

    const first = useCase.execute();
    await expect(useCase.execute()).rejects.toThrow(IngestionError);

    release([]);
    await first;
  });
});
