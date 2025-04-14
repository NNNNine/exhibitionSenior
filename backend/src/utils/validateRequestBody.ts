/**
 * Validates request body parameters against common validations
 * 
 * @param params Object containing parameters to validate
 * @throws Error with validation message if validation fails
 */
export async function validateRequestBody(params: Record<string, any>) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        throw { 
          code: 400, 
          error: new Error(`Parameter ${key} is required`) 
        };
      }
      
      // Validate pagination parameters
      if (key === 'limit' || key === 'offset') {
        if (typeof value !== 'number' && (typeof value === 'string' && isNaN(Number(value)))) {
          throw { 
            code: 400, 
            error: new Error(`Parameter ${key} must be a number`) 
          };
        }
        
        if (Number(value) < 0) {
          throw { 
            code: 400, 
            error: new Error(`Parameter ${key} cannot be negative`) 
          };
        }
      }
      
      // Validate ID parameters
      if (key.toLowerCase().endsWith('id')) {
        if (typeof value !== 'number' && typeof value !== 'string') {
          throw { 
            code: 400, 
            error: new Error(`Parameter ${key} must be a number or string`) 
          };
        }
        
        if (typeof value === 'string' && value.trim() === '') {
          throw { 
            code: 400, 
            error: new Error(`Parameter ${key} cannot be empty`) 
          };
        }
      }
      
      // Validate string parameters
      if (key.includes('name') || key.includes('title') || key.includes('description')) {
        if (typeof value !== 'string') {
          throw { 
            code: 400, 
            error: new Error(`Parameter ${key} must be a string`) 
          };
        }
      }
    }
    
    return true;
  }