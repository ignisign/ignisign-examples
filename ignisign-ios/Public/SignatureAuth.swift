//
//  SignatureAuth.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignAuthFullMechanismRef {
    case SIMPLE
    case PHONE_SMS
    case PHONE_CALL
    case TOTP
    case PASS_KEY_POSSESSION
    case AES_EID
    case QES_EID
}
