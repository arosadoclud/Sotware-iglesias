import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  Min, 
  Max, 
  IsArray, 
  MinLength, 
  MaxLength,
  IsMongoId
} from 'class-validator';

export enum PersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  NEW = 'NEW',
  LEADER = 'LEADER',
}

export class CreatePersonDto {
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsString()
  @MinLength(2, { message: 'El ministerio debe tener al menos 2 caracteres' })
  ministry: string;

  @IsEnum(PersonStatus, { message: 'Estado inválido' })
  status: PersonStatus;

  @Min(1, { message: 'La prioridad mínima es 1' })
  @Max(10, { message: 'La prioridad máxima es 10' })
  priority: number;

  @IsArray()
  @IsMongoId({ each: true, message: 'IDs de roles inválidos' })
  roleIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  notes?: string;
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  ministry?: string;

  @IsOptional()
  @IsEnum(PersonStatus)
  status?: PersonStatus;

  @IsOptional()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  roleIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
