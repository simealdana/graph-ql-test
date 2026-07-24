import { AppConfigService } from '../../config/app-config.service';
import { ExternalApiError } from '../../domain/errors/domain.errors';
import { NhtsaApiClient } from './nhtsa-api.client';
import { NhtsaXmlMapper } from './nhtsa-xml.mapper';

const MAKES_XML = `<Response><Count>1</Count><Results><AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes></Results></Response>`;
const TYPES_XML = `<Response><Count>1</Count><Results><VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds></Results></Response>`;

function configStub(): AppConfigService {
  return {
    nhtsa: {
      baseUrl: 'https://nhtsa.test/api',
      requestTimeoutMs: 1000,
      maxRetries: 2,
    },
  } as unknown as AppConfigService;
}

function okResponse(body: string): Response {
  return { ok: true, status: 200, text: () => Promise.resolve(body) } as unknown as Response;
}

function errorResponse(status: number): Response {
  return { ok: false, status, text: () => Promise.resolve('') } as unknown as Response;
}

describe('NhtsaApiClient', () => {
  let client: NhtsaApiClient;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    client = new NhtsaApiClient(configStub(), new NhtsaXmlMapper());
    fetchMock = jest.spyOn(global, 'fetch');
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches and parses all makes', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(MAKES_XML));

    await expect(client.getAllMakes()).resolves.toEqual([
      { makeId: 440, makeName: 'ASTON MARTIN' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://nhtsa.test/api/vehicles/getallmakes?format=XML',
      expect.objectContaining({ headers: { Accept: 'application/xml' } }),
    );
  });

  it('fetches and parses vehicle types for a make', async () => {
    fetchMock.mockResolvedValueOnce(okResponse(TYPES_XML));

    await expect(client.getVehicleTypesForMake(440)).resolves.toEqual([
      { typeId: 2, typeName: 'Passenger Car' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://nhtsa.test/api/vehicles/GetVehicleTypesForMakeId/440?format=xml',
      expect.anything(),
    );
  });

  it('retries retryable HTTP errors (e.g. 503) before succeeding', async () => {
    fetchMock
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(okResponse(MAKES_XML));

    await expect(client.getAllMakes()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries network failures', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce(okResponse(MAKES_XML));

    await expect(client.getAllMakes()).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable HTTP errors (e.g. 404)', async () => {
    fetchMock.mockResolvedValue(errorResponse(404));

    await expect(client.getAllMakes()).rejects.toThrow(ExternalApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after exhausting retries', async () => {
    fetchMock.mockResolvedValue(errorResponse(503));

    await expect(client.getAllMakes()).rejects.toThrow(ExternalApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
