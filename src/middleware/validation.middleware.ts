import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
              body: req.body,
              query: req.query,
              params: req.params
            });
            next();
          } catch (error) {
            if (error instanceof ZodError) {
              const errors: Record<string, string[]> = {};
              
              error.errors.forEach((err) => {
                const path = err.path.slice(1).join('.');
                if (!errors[path]) {
                  errors[path] = [];
                }
                errors[path].push(err.message);
              });
      
              next(new ValidationError(errors));
            } else {
              next(error);
            }
          }
    }
}

//function that will help us validate out data 
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
  
        throw new ValidationError(errors);
      }
      throw error;
    }
  };