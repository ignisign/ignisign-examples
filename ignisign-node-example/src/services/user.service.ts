import { IgnisignSigner_CreationRequestDto } from "@ignisign/public";
import { MyUser, MyUserModel, MY_USER_TYPES } from "../models/user.db.model";
import { IgnisignSdkManagerService } from "./ignisign-sdk-manager.service";

const getUsers = async (type: MY_USER_TYPES): Promise<MyUser[]> => {
  return new Promise((resolve, reject) => {
    MyUserModel
      .find({type})
      .toArray((error, found) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(found);
        }
      });
  });
}

const getUser = async (userId): Promise<MyUser> => {
  return new Promise((resolve, reject) => {
    MyUserModel
      .find({_id: userId})
      .toArray((error, found) => {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          resolve(found[0]);
        }
      });
    });
}

const addUser = (type: MY_USER_TYPES, inputs: IgnisignSigner_CreationRequestDto): Promise<MyUser> => {
  const signatureProfileId = process.env.IGNISIGN_SIGNATURE_PROFILE_ID;
  try {
    return new Promise((resolve, reject) => {
      MyUserModel.insert(
        {...inputs, type, signatureProfileId}, 
        async (error, found) => {
          if (error) {
            console.error(error);
            reject(error);

          } else {
            try {

              const userId = found?.length ? found[0]._id.toString() : null;
              const user = await IgnisignSdkManagerService.createNewSigner(
                signatureProfileId, 
                {
                  ...inputs,
                  ...(inputs?.birthDate && { birthDate : inputs.birthDate.toString()}), 
                }, 
                userId )
    
              const { signerId, authSecret } = user;
            
              MyUserModel.update(
                {_id: userId}, 
                {signerId, ignisignAuthSecret: authSecret, ...inputs, type, signatureProfileId}, 
                (error, f)=>{
                  resolve(found[0]);
                })
              
            } catch (error) {
              console.error(error)
            }
          }
        });
    });
  } catch (error) {
    console.error(error)
  }
}

export const UserService = {
  getUser,
  addUser,
  getUsers
}