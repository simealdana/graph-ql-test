import { Injectable, Logger } from '@nestjs/common';
import { withRetry } from '../../common/utils/retry';
import { AppConfigService } from '../../config/app-config.service';
import { Make } from '../../domain/entities/make.entity';
import { VehicleType } from '../../domain/entities/vehicle-type.entity';
import { ExternalApiError } from '../../domain/errors/domain.errors';
import { VehicleDataSource } from '../../domain/ports/vehicle-data-source.port';
import { NhtsaXmlMapper } from './nhtsa-xml.mapper';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

@Injectable()
export class NhtsaApiClient implements VehicleDataSource {
  private readonly logger = new Logger(NhtsaApiClient.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly mapper: NhtsaXmlMapper,
  ) {}

  async getAllMakes(): Promise<Make[]> {
    const xml = await this.fetchXml('/vehicles/getallmakes?format=XML');
    return this.mapper.parseAllMakes(xml);
  }

  async getVehicleTypesForMake(makeId: number): Promise<VehicleType[]> {
    const xml = await this.fetchXml(`/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`);
    return this.mapper.parseVehicleTypesForMake(xml);
  }

  private async fetchXml(path: string): Promise<string> {
    const { baseUrl, requestTimeoutMs, maxRetries } = this.config.nhtsa;
    const url = `${baseUrl}${path}`;

    return withRetry(() => this.doFetch(url, requestTimeoutMs), {
      maxRetries,
      shouldRetry: (error) => this.isRetryable(error),
      onRetry: (error, attempt, delayMs) => {
        this.logger.warn({
          msg: 'Retrying NHTSA request',
          url,
          attempt,
          delayMs,
          reason: error instanceof Error ? error.message : String(error),
        });
      },
    });
  }

  private async doFetch(url: string, timeoutMs: number): Promise<string> {
    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: 'application/xml' },
      });
    } catch (error) {
      throw new ExternalApiError(
        `Network failure calling NHTSA API: ${error instanceof Error ? error.message : String(error)}`,
        url,
        error,
      );
    }

    if (!response.ok) {
      throw new ExternalApiError(
        `NHTSA API responded with HTTP ${response.status}`,
        url,
        response.status,
      );
    }

    return response.text();
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof ExternalApiError) {
      if (typeof error.cause === 'number') {
        return RETRYABLE_STATUS_CODES.has(error.cause);
      }
      return true;
    }
    return false;
  }
}
