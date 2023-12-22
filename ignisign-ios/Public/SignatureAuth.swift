//
//  SignatureAuth.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignAuthFullMechanismRef: String {
    case SIMPLE = "SIMPLE"
    case PHONE_SMS = "PHONE_SMS"
    case PHONE_CALL = "PHONE_CALL"
    case TOTP = "TOTP"
    case PASS_KEY_POSSESSION = "PASS_KEY_POSSESSION"
    case AES_EID = "AES_EID"
    case QES_EID = "QES_EID"
}
