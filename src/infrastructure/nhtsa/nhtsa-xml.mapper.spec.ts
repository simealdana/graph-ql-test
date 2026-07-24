import { TransformationError, XmlParseError } from '../../domain/errors/domain.errors';
import { NhtsaXmlMapper } from './nhtsa-xml.mapper';

const ALL_MAKES_XML = `<Response>
  <Count>3</Count>
  <Message>Response returned successfully</Message>
  <Results>
    <AllVehicleMakes><Make_ID>440</Make_ID><Make_Name>ASTON MARTIN</Make_Name></AllVehicleMakes>
    <AllVehicleMakes><Make_ID>441</Make_ID><Make_Name>TESLA</Make_Name></AllVehicleMakes>
    <AllVehicleMakes><Make_ID>442</Make_ID><Make_Name> JAGUAR </Make_Name></AllVehicleMakes>
  </Results>
</Response>`;

const VEHICLE_TYPES_XML = `<Response>
  <Count>2</Count>
  <Message>Response returned successfully</Message>
  <SearchCriteria>Make ID: 440</SearchCriteria>
  <Results>
    <VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds>
    <VehicleTypesForMakeIds><VehicleTypeId>7</VehicleTypeId><VehicleTypeName>Multipurpose Passenger Vehicle (MPV)</VehicleTypeName></VehicleTypesForMakeIds>
  </Results>
</Response>`;

const SINGLE_TYPE_XML = `<Response>
  <Count>1</Count>
  <Results>
    <VehicleTypesForMakeIds><VehicleTypeId>2</VehicleTypeId><VehicleTypeName>Passenger Car</VehicleTypeName></VehicleTypesForMakeIds>
  </Results>
</Response>`;

const EMPTY_RESULTS_XML = `<Response><Count>0</Count><Results /></Response>`;

describe('NhtsaXmlMapper', () => {
  let mapper: NhtsaXmlMapper;

  beforeEach(() => {
    mapper = new NhtsaXmlMapper();
  });

  describe('parseAllMakes', () => {
    it('transforms the XML list of makes into domain entities', () => {
      expect(mapper.parseAllMakes(ALL_MAKES_XML)).toEqual([
        { makeId: 440, makeName: 'ASTON MARTIN' },
        { makeId: 441, makeName: 'TESLA' },
        { makeId: 442, makeName: 'JAGUAR' },
      ]);
    });

    it('returns an empty array when Results is empty', () => {
      expect(mapper.parseAllMakes(EMPTY_RESULTS_XML)).toEqual([]);
    });

    it('throws XmlParseError for malformed XML', () => {
      expect(() => mapper.parseAllMakes('<Response><unclosed>')).toThrow(XmlParseError);
    });

    it('throws XmlParseError for empty payloads', () => {
      expect(() => mapper.parseAllMakes('')).toThrow(XmlParseError);
    });

    it('throws TransformationError when the root element is unexpected', () => {
      expect(() => mapper.parseAllMakes('<Other>data</Other>')).toThrow(TransformationError);
    });

    it('throws TransformationError when Make_ID is not numeric', () => {
      const xml = `<Response><Results><AllVehicleMakes><Make_ID>abc</Make_ID><Make_Name>X</Make_Name></AllVehicleMakes></Results></Response>`;
      expect(() => mapper.parseAllMakes(xml)).toThrow(TransformationError);
    });

    it('throws TransformationError when Make_Name is empty', () => {
      const xml = `<Response><Results><AllVehicleMakes><Make_ID>1</Make_ID><Make_Name></Make_Name></AllVehicleMakes></Results></Response>`;
      expect(() => mapper.parseAllMakes(xml)).toThrow(TransformationError);
    });
  });

  describe('parseVehicleTypesForMake', () => {
    it('transforms the XML list of vehicle types into domain entities', () => {
      expect(mapper.parseVehicleTypesForMake(VEHICLE_TYPES_XML)).toEqual([
        { typeId: 2, typeName: 'Passenger Car' },
        { typeId: 7, typeName: 'Multipurpose Passenger Vehicle (MPV)' },
      ]);
    });

    it('handles a single vehicle type (non-array XML element)', () => {
      expect(mapper.parseVehicleTypesForMake(SINGLE_TYPE_XML)).toEqual([
        { typeId: 2, typeName: 'Passenger Car' },
      ]);
    });

    it('returns an empty array when a make has no vehicle types', () => {
      expect(mapper.parseVehicleTypesForMake(EMPTY_RESULTS_XML)).toEqual([]);
    });
  });
});
