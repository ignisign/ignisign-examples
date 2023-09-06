
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

  const getSignatureProfiles = async () => {
    const sr = await ApiService.getSignatureProfiles();
    setSignatureProfiles(sr);

    if(!selectedSignatureProfile && !selectedSignatureProfileId && sr.length > 0)
      doSelectSignatureProfile(sr[0]._id);
  }

  const doSelectSignatureProfile = (signatureProfileId) => {
    setSelectedSignatureProfile(signatureProfiles.find((e=>e._id === signatureProfileId)));
    setSelectedSignatureProfileId(signatureProfileId);
  }

  useEffect(() => {
    getSignatureProfiles()
  }, [])

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
