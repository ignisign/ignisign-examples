
import { Router } from "express";
import { jsonSuccess } from "../utils/controller.util";
import { NextFunction, Request, Response } from 'express';
import { LogCapsuleService } from "../services/example/log-capsule.service";

// Example Controller used to manage customers
export const LogCapsuleController = (router: Router) => {

  
  router.post('/v1/log-capsule', async (req: Request, res: Response, next: NextFunction) => {
    try {
      
    const result = await LogCapsuleService.logCapsuleCreate();
      
      return jsonSuccess(res, true)
    } catch(e) { next(e) }
  })

} 