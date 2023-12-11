import { IgnisignSigner_CreationRequestDto } from "@ignisign/public";
import { MyUser, MyUserModel, MY_USER_TYPES } from "../models/user.db.model";
import { IgnisignSdkManagerService } from "./ignisign-sdk-manager.service";


/** Promise Related Complexity WARNING : 
 *  Due of a lack  of integration of `Promises` into the `tingodb` library, 
 *  this service implementation below are a little bit complex to abstract this lack of integration to upper level services and controllers.
 **/

export const UserService = {
  getUser,
  addUser,
  getUsers
}

async function getUsers(type: MY_USER_TYPES): Promise<MyUser[]> {
  return new Promise(async (resolve, reject) => {

    await MyUserModel.find({ type }).toArray((error, users) => {
      if (error) {
        console.error(error);
        reject(error);
        return
      }
      resolve(users);
      
    });
  });
}

async function getUser(userId): Promise<MyUser> {
  return new Promise((resolve, reject) => {
    MyUserModel.findOne({_id: userId}, async (error, user) => {
        if (error) {
          console.error(error);
          reject(error);
          return;
        }
      
        if (!user) {
          reject(new Error("User not found: " + userId));
          return;
        }

        resolve(user);
      });
    });
}

async function addUser(type: MY_USER_TYPES, inputs: IgnisignSigner_CreationRequestDto): Promise<MyUser> {
  const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID;
  try {
    return new Promise<MyUser>((resolve, reject) => {
      MyUserModel.insert( {...inputs, type, signatureProfileId},  async (error, inserted) => {
          if (error) {
            console.error(error);
            reject(error);
            return;
          }

          if (!inserted || !inserted.length) {
            reject(new Error("User not inserted"));
            return;
          }

          try {
            const userId = inserted[0]._id.toString();

            const inputToCreate = {
              ...inputs,
              ...(inputs?.birthDate && { birthDate : inputs.birthDate.toString()}), 
            }

            // TODO update this to use the new IgnisignSdkManagerService.createSigner method
            const signer = await IgnisignSdkManagerService.createNewSigner(signatureProfileId, inputToCreate, userId);
  
            const { signerId, authSecret } = signer;
          
            MyUserModel.update(
              {_id: userId}, 
              {signerId, ignisignAuthSecret: authSecret, ...inputs, type, signatureProfileId}, 
              (error, user)=> error ? reject(error) : resolve(user));
            
          } catch (error) {
            console.error(error)
          }
        });
    });

  } catch (error) {
    console.error(error)
  }
}

