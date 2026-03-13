import { PayloadDto } from './jwtPayload.dto';
import type { Request, Response } from 'express';
import type { UserByIdLoader } from 'src/dataloaders/user-by-id.loader';

export interface ContextWithJWTPayload {
  jwtPayload: PayloadDto;
  req?: Request;
  res?: Response;
  loaders: {
    userById: UserByIdLoader;
  };
}
