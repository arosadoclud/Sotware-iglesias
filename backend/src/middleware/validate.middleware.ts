import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

export function validateDto(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dtoInstance = plainToClass(dtoClass, req.body);
      const errors: ValidationError[] = await validate(dtoInstance);

      if (errors.length > 0) {
        const messages = errors.map((error: ValidationError) =>
          Object.values(error.constraints || {})
        ).flat();

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: messages,
        });
      }

      // Replace req.body with validated DTO
      req.body = dtoInstance;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Validation error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
