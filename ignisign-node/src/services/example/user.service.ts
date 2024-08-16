import { IgnisignSigner_CreationRequestDto } from "@ignisign/public";
import { MyUser, MyUserModel, MY_USER_TYPES } from "../../models/user.db.model";
import { IgnisignSdkManagerSigantureService } from "../ignisign/ignisign-sdk-manager-signature.service";
import { IgnisignInitializerService } from "../ignisign/ignisign-sdk-initializer.service";
import { findCallback, findOneCallback, insertCallback } from "./tinydb.utils";


/** Promise Related Complexity WARNING : 
 *  Due of a lack  of integration of `Promises` into the `tingodb` library, 
 *  this service implementation below are a little bit complex to abstract this lack of integration to upper level services and controllers.
 **/

const DEBUG_LOG_ACTIVATED = false;
const _logIfDebug = (...message) => { if(DEBUG_LOG_ACTIVATED) console.log(...message) }

export const UserService = {
  getUser,
  addUser,
  getUsers,
  getAllUsers,
}


async function getAllUsers(): Promise<MyUser[]> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  return new Promise(async (resolve, reject) => {

    await MyUserModel.find({
      ignisignAppId,
      ignisignAppEnv,
    }).toArray(findCallback(resolve, reject));
  });
}

async function getUsers(type: MY_USER_TYPES): Promise<MyUser[]> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  return new Promise(async (resolve, reject) => {

    await MyUserModel.find({ 
      type,
      ignisignAppId,
      ignisignAppEnv,
     }).toArray(findCallback(resolve, reject));
  });
}

async function getUser(userId): Promise<MyUser> {
  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  return new Promise((resolve, reject) => {
    MyUserModel.findOne({
      _id           : userId,
      ignisignAppId,
      ignisignAppEnv,
    }, findOneCallback(resolve, reject, true));
  });
}

async function addUser(
  type: MY_USER_TYPES, 
  inputs: IgnisignSigner_CreationRequestDto
): Promise<MyUser> {

  const { ignisignAppId, ignisignAppEnv} = await IgnisignInitializerService.getAppContext();

  const employeeSignerProfileId = process.env.IGNISIGN_EMPLOYEE_SIGNER_PROFILE_ID;
  const customerSignerProfileId = process.env.IGNISIGN_CUSTOMER_SIGNER_PROFILE_ID;
  const signerProfileId = type === MY_USER_TYPES.CUSTOMER ? customerSignerProfileId : employeeSignerProfileId;

  try {
   
    const user : MyUser =  await new Promise<MyUser>((resolve, reject) => {
      MyUserModel.insert( {
        ...inputs, 
        type, 
        signerProfileId,
        ignisignAppId,
        ignisignAppEnv,
      },  insertCallback(resolve, reject)
    )});
    
    const userId = user._id.toString();

    const inputToCreate = {
      ...inputs,
      ...(inputs?.birthDate && { birthDate : inputs.birthDate.toString()}), 
    }

    _logIfDebug("inputToCreate");
    
    const signer = await IgnisignSdkManagerSigantureService.createNewSigner(signerProfileId, inputToCreate, userId);

    const { signerId, authSecret } = signer;

    const toUpdate = { ...inputs, type, signerProfileId , signerId, ignisignAuthSecret: authSecret};

    return new Promise((resolve, reject) => {
      MyUserModel.update(
        {_id: userId,  ignisignAppId, ignisignAppEnv}, 
        toUpdate, 
        (error, result)=> error ? reject(error) : resolve({...toUpdate, _id: userId}));
      
    });
            
  } catch (error) {
    console.error(error)
  }
}

