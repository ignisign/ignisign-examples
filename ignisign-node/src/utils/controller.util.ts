
import { Response } from 'express';

// https://github.com/expressjs/multer/issues/343
export interface MulterFile {
  path          : string 
  mimetype      : string
  originalname  : string
  size          : number
}

export const jsonSuccess = <T = any>(res : Response, obj : T) => {
  res.status(200).json(obj);
}

export const jsonError = (res : Response, error : any) => {
  res.status(400).json({message: error?.context?.message});
}
