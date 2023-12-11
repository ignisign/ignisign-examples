import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/user.service";
import { MY_USER_TYPES } from "../models/user.db.model";
  
// Example Controller used to manage sellers
export const sellerController = (router: Router) => {

  // retrieve all sellers
  router.get('/v1/sellers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const found = await UserService.getUsers(MY_USER_TYPES.SELLER);
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })


  // Create a new sellet
  // The UserService.addUser method create signers.
  router.post('/v1/sellers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const found: any = await UserService.addUser(MY_USER_TYPES.SELLER, req.body);
      return jsonSuccess(res, found)
      
    } catch(e) { next(e) }
  })
} 