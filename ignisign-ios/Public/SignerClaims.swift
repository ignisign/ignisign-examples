//
//  SignerClaims.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 20/12/2023.
//

import Foundation

enum IgnisignSignerClaimRef {
    case EID_POSSESSION_AES
    case EID_POSSESSION_QES
    case PHONE_NUMBER_POSSESSION
    case PRIVATE_KEY_POSSESSION
    case DAPP_WALLET_POSSESSION
    case APP_SIGNER_SECRET_POSSESSION
    case TOTP_POSSESSION
    case EMAIL_POSSESSION
    case ID_DOC_POSSESSION_QES
    case ID_DOC_POSSESSION_AES
    case SOCIAL_SECURITY_NUMBER_POSSESSION
    case RA_PROCESS_VALIDATED_AES
    case RA_PROCESS_VALIDATED_QES
    case BANK_ACCOUNT_POSSESSION
    case NATURAL_PERSON_NAME
    case LEGAL_PERSON_NAME
    case PASS_KEY_POSSESSION
    case NATIONALITY
    case BIRTH_INFO
}

enum IgnisignSignerClaimStatus {
    case DECLARED
    case VERIFIED
    case REJECTED
    case DEPRECATED
}
