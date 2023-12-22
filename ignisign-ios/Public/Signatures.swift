//
//  Signatures.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignSignatureMode {
    case INIT
    case SIGNED
    case FAILED
}

enum IgnisignSignatureStatus {
    case INIT
    case SIGNED
    case FAILED
}

enum IgnisignIntegrationMode {
    case BY_SIDE
    case EMBEDDED
}

struct IgnisignSignature {
    var _id: String
    var appId: String
    var appEnv: IgnisignApplicationEnv
    var signerId: String
    var signerKeyId: String
    var sessionId: String
    var documentId: String
    var status: IgnisignSignatureStatus
    var mode: IgnisignIntegrationMode
    var ocspCheckValue: Any
    var contentHash: String
    var signature: String
    var signatureValue: String
    var signatureProperties: String
    var signedPropertiesHash: String
    var signingIp: String
    var signingTime: String
    var certificate: String
}

struct IgnisignApplicationSignatureMetadata {
    var appName: String
    var logoB64: String
    var logoDarkB64: String
    var rootUrl: String
    var primaryColor: IgnisignApplicationVariationColor
    var secondaryColor: IgnisignApplicationVariationColor
}

struct IgnisignSignatureImagesDto {
    let documentId: String
    let signatures: [SignatureImage]

    struct SignatureImage {
        let signerId: String
        let imgB64: String
    }
}


