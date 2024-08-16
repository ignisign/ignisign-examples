import { IGNISIGN_APPLICATION_TYPE, IGNISIGN_SIGNER_CREATION_INPUT_REF, IgnisignSigner_CreationRequestDto, IgnisignSignerProfile } from "@ignisign/public";
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
  getSignerProfileIds,
  getConstraintsAndSignerProfileIds,
}

async function getSignerProfileIds(appType : IGNISIGN_APPLICATION_TYPE) : Promise<{ employeeSignerProfileId?: string, customerSignerProfileId?: string, signerProfileId? : string }>{

  if(appType === IGNISIGN_APPLICATION_TYPE.LOG_CAPSULE){
    return {};
  } 

  let signerProfiles = await IgnisignSdkManagerSigantureService.getSignerProfiles();

  if(signerProfiles.length === 0)
    throw new Error("No Signer Profile found in the Ignisign App");

  if(appType === IGNISIGN_APPLICATION_TYPE.BARE_SIGNATURE || appType === IGNISIGN_APPLICATION_TYPE.SEAL){
    return { signerProfileId: signerProfiles[0]._id };

  } else if(appType === IGNISIGN_APPLICATION_TYPE.SIGNATURE){
    const maybeSPCustomers = signerProfiles.find(sp => sp.name === "Customers");
    const maybeSPEmployees = signerProfiles.find(sp => sp.name === "Employees");
    
    const employeeSignerProfileId = maybeSPEmployees ? maybeSPEmployees._id : signerProfiles[0]._id;
    const customerSignerProfileId = maybeSPCustomers ? maybeSPCustomers._id : signerProfiles[0]._id;
  
    return { employeeSignerProfileId, customerSignerProfileId };
  }
  
}

async function getConstraintsAndSignerProfileIds(signerProfileId : string) : Promise<{ requiredInputs: IGNISIGN_SIGNER_CREATION_INPUT_REF[], signerProfile: IgnisignSignerProfile }>{
  return {
    requiredInputs: await IgnisignSdkManagerSigantureService.getSignerInputsConstraintsFromSignerProfileId(signerProfileId),
    signerProfile: await IgnisignSdkManagerSigantureService.getSignerProfile(signerProfileId),
  }

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

  const { ignisignAppId, ignisignAppEnv, appType} = await IgnisignInitializerService.getAppContext();

  const { employeeSignerProfileId, customerSignerProfileId } = await getSignerProfileIds(appType);

  const signerProfileId = (type === MY_USER_TYPES.CUSTOMER) 
    ? customerSignerProfileId 
    : employeeSignerProfileId;

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

