// src/modules/business/dto/create-business.dto.ts
export class CreateBusinessDto {
  name: string;
  category: string;
  description: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  photos?: string[];
}

