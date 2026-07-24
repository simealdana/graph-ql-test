import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ExternalApiError } from '../src/domain/errors/domain.errors';
import { MAKE_REPOSITORY } from '../src/domain/ports/make-repository.port';
import {
  VEHICLE_DATA_SOURCE,
  VehicleDataSource,
} from '../src/domain/ports/vehicle-data-source.port';
import { PrismaService } from '../src/infrastructure/persistence/prisma.service';
import { InMemoryMakeRepository } from './in-memory-make.repository';

describe('Vehicle data service (e2e)', () => {
  let app: INestApplication;
  let dataSource: jest.Mocked<VehicleDataSource>;

  beforeAll(async () => {
    dataSource = {
      getAllMakes: jest.fn().mockResolvedValue([
        { makeId: 440, makeName: 'ASTON MARTIN' },
        { makeId: 441, makeName: 'TESLA' },
      ]),
      getVehicleTypesForMake: jest.fn().mockImplementation((makeId: number) =>
        Promise.resolve(
          makeId === 440
            ? [
                { typeId: 2, typeName: 'Passenger Car' },
                { typeId: 7, typeName: 'Multipurpose Passenger Vehicle (MPV)' },
              ]
            : [{ typeId: 2, typeName: 'Passenger Car' }],
        ),
      ),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(VEHICLE_DATA_SOURCE)
      .useValue(dataSource)
      .overrideProvider(MAKE_REPOSITORY)
      .useValue(new InMemoryMakeRepository())
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  function gql(query: string): request.Test {
    return request(app.getHttpServer()).post('/graphql').send({ query });
  }

  it('GET /health returns ok', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('triggerIngestion ingests mocked NHTSA data and reports a summary', async () => {
    const response = await gql(`
      mutation {
        triggerIngestion {
          totalMakesDiscovered
          makesProcessed
          makesSucceeded
          makesFailed
          vehicleTypesLinked
          failures { makeId reason }
        }
      }
    `).expect(200);

    expect(response.body.data.triggerIngestion).toMatchObject({
      totalMakesDiscovered: 2,
      makesProcessed: 2,
      makesSucceeded: 2,
      makesFailed: 0,
      vehicleTypesLinked: 3,
      failures: [],
    });
  });

  it('makes query returns the ingested data in the unified JSON shape', async () => {
    const response = await gql(`
      query {
        makes(limit: 10, offset: 0) {
          total
          items {
            makeId
            makeName
            vehicleTypes { typeId typeName }
          }
        }
      }
    `).expect(200);

    expect(response.body.data.makes.total).toBe(2);
    expect(response.body.data.makes.items).toEqual([
      {
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [
          { typeId: 2, typeName: 'Passenger Car' },
          { typeId: 7, typeName: 'Multipurpose Passenger Vehicle (MPV)' },
        ],
      },
      {
        makeId: 441,
        makeName: 'TESLA',
        vehicleTypes: [{ typeId: 2, typeName: 'Passenger Car' }],
      },
    ]);
  });

  it('makes query supports search', async () => {
    const response = await gql(`
      query {
        makes(limit: 10, offset: 0, search: "tesla") {
          total
          items { makeId makeName }
        }
      }
    `).expect(200);

    expect(response.body.data.makes.items).toEqual([{ makeId: 441, makeName: 'TESLA' }]);
  });

  it('make query returns a single make or null', async () => {
    const found = await gql(`query { make(makeId: 440) { makeId makeName } }`).expect(200);
    expect(found.body.data.make).toEqual({ makeId: 440, makeName: 'ASTON MARTIN' });

    const missing = await gql(`query { make(makeId: 999999) { makeId } }`).expect(200);
    expect(missing.body.data.make).toBeNull();
  });

  it('maps domain errors to typed GraphQL errors', async () => {
    dataSource.getAllMakes.mockRejectedValueOnce(new ExternalApiError('NHTSA API is down'));

    const response = await gql(`mutation { triggerIngestion { makesSucceeded } }`).expect(200);

    expect(response.body.errors[0]).toMatchObject({
      message: 'NHTSA API is down',
      extensions: { code: 'EXTERNAL_API_ERROR' },
    });
  });

  it('rejects invalid pagination arguments', async () => {
    const response = await gql(`query { makes(limit: 5000) { total } }`).expect(200);

    expect(response.body.errors).toBeDefined();
    expect(response.body.data).toBeNull();
  });
});
