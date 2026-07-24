import { Injectable } from '@nestjs/common';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { Make } from '../../domain/entities/make.entity';
import { VehicleType } from '../../domain/entities/vehicle-type.entity';
import { TransformationError, XmlParseError } from '../../domain/errors/domain.errors';

interface RawAllMakesResult {
  Make_ID?: unknown;
  Make_Name?: unknown;
}

interface RawVehicleTypeResult {
  VehicleTypeId?: unknown;
  VehicleTypeName?: unknown;
}

@Injectable()
export class NhtsaXmlMapper {
  private readonly parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

  parseAllMakes(xml: string): Make[] {
    const results = this.extractResults(xml, 'AllVehicleMakes');
    return results.map((raw: RawAllMakesResult) => ({
      makeId: this.toInt(raw.Make_ID, 'Make_ID'),
      makeName: this.toNonEmptyString(raw.Make_Name, 'Make_Name'),
    }));
  }

  parseVehicleTypesForMake(xml: string): VehicleType[] {
    const results = this.extractResults(xml, 'VehicleTypesForMakeIds');
    return results.map((raw: RawVehicleTypeResult) => ({
      typeId: this.toInt(raw.VehicleTypeId, 'VehicleTypeId'),
      typeName: this.toNonEmptyString(raw.VehicleTypeName, 'VehicleTypeName'),
    }));
  }

  private extractResults(xml: string, elementName: string): Record<string, unknown>[] {
    if (typeof xml !== 'string' || xml.trim() === '') {
      throw new XmlParseError('Received an empty XML document');
    }

    const validation = XMLValidator.validate(xml);
    if (validation !== true) {
      throw new XmlParseError(`Invalid XML document: ${validation.err.msg}`);
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = this.parser.parse(xml) as Record<string, unknown>;
    } catch (error) {
      throw new XmlParseError('Failed to parse XML document', error);
    }

    const response = parsed.Response as Record<string, unknown> | undefined;
    if (!response) {
      throw new TransformationError('Unexpected XML shape: missing <Response> root element');
    }

    const results = response.Results as Record<string, unknown> | undefined | '';
    if (results === undefined || results === '' || results === null) {
      return [];
    }

    const entries = results[elementName];
    if (entries === undefined) {
      return [];
    }

    return Array.isArray(entries)
      ? (entries as Record<string, unknown>[])
      : [entries as Record<string, unknown>];
  }

  private toInt(value: unknown, field: string): number {
    const parsed = Number.parseInt(String(value), 10);
    if (Number.isNaN(parsed)) {
      throw new TransformationError(`Expected numeric value for "${field}", got: ${String(value)}`);
    }
    return parsed;
  }

  private toNonEmptyString(value: unknown, field: string): string {
    const parsed =
      typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
    if (parsed === '') {
      throw new TransformationError(`Expected non-empty string for "${field}"`);
    }
    return parsed;
  }
}
