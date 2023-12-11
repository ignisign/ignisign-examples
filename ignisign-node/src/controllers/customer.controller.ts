import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/user.service";
import { MY_USER_TYPES } from "../models/user.db.model";
  
// Example Controller used to manage customers
export const customerController = (router: Router) => {

  // retrieve all customers
  router.get('/v1/customers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const found = await UserService.getUsers(MY_USER_TYPES.CUSTOMER);
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })

  // Create a new customer
  // The UserService.addUser method create signers.
  router.post('/v1/customers', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const found = await UserService.addUser(MY_USER_TYPES.CUSTOMER, req.body);
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })
  
} 