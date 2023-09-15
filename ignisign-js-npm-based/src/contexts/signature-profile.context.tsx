
import { IgnisignSignatureProfile } from "@ignisign/public";
import { useState, createContext, useContext, useEffect } from "react";
import { ApiService } from "../services/api.service";

export interface ISignatureProfilesContext {
  signatureProfiles             : IgnisignSignatureProfile[];
  doSelectSignatureProfile      : (signatureProfileId) => void;
  selectedSignatureProfile      : IgnisignSignatureProfile;
  selectedSignatureProfileId    : string;
}

const SignatureProfilesContext = createContext<ISignatureProfilesContext>( {} as ISignatureProfilesContext);

const SignatureProfilesContextProvider = ({ children }) => {
  const [signatureProfiles, setSignatureProfiles]                      = useState<IgnisignSignatureProfile[]>([]);
  const [selectedSignatureProfile, setSelectedSignatureProfile]        = useState(null);
  const [selectedSignatureProfileId, setSelectedSignatureProfileId]    = useState(null);

  useEffect(() => {
    getSignatureProfiles()
  }, [])

  const getSignatureProfiles = async () => {
    const sps = await ApiService.getSignatureProfiles();

    if(!sps || sps.length === 0)
      window.alert("No signature profile found. Please create one first.");
    else {
      setSignatureProfiles(sps);

      if(!selectedSignatureProfile && !selectedSignatureProfileId)
        doSelectSignatureProfile(sps[0]._id);
    } 
  }

  const doSelectSignatureProfile = (signatureProfileId) => {
    if(!signatureProfileId)
      return;

    setSelectedSignatureProfile(signatureProfiles.find((e=>e._id === signatureProfileId)));
    setSelectedSignatureProfileId(signatureProfileId);
  }

  

  const context = { 
    signatureProfiles,
    doSelectSignatureProfile,
    selectedSignatureProfile,
    selectedSignatureProfileId,
  };

  return (
    <SignatureProfilesContext.Provider value={context}>
      {children}
    </SignatureProfilesContext.Provider>)
};

const useSignatureProfiles = () => useContext(SignatureProfilesContext)

export {
  useSignatureProfiles,
  SignatureProfilesContextProvider,
};
