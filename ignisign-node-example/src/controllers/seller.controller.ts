import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/user.service";
import { MY_USER_TYPES } from "../models/user.db.model";
  
export const sellerController = (router: Router) => {
  router.get('/v1/sellers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const found = await UserService.getUsers(MY_USER_TYPES.SELLER);
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })

  router.post('/v1/sellers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // console.log(req.body);
      const found: any = await UserService.addUser(MY_USER_TYPES.SELLER, req.body);
      // console.log({found});
      
      // let res = found && found.length ? found[0] : null
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })
} 