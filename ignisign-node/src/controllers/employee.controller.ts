import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { UserService } from "../services/example/user.service";
import { MY_USER_TYPES } from "../models/user.db.model";
  
// Example Controller used to manage employees
export const employeeController = (router: Router) => {

  // retrieve all employees
  router.get('/v1/employees', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const found = await UserService.getUsers(MY_USER_TYPES.EMPLOYEE);
      return jsonSuccess(res, found)
    } catch(e) { next(e) }
  })


  // Create a new employee
  // The UserService.addUser method create signers.
  router.post('/v1/employees', async (req: Request, res: Response, next: NextFunction) => {
    try {      
      const found: any = await UserService.addUser(MY_USER_TYPES.EMPLOYEE, req.body);
      return jsonSuccess(res, found)
      
    } catch(e) { next(e) }
  })
} 