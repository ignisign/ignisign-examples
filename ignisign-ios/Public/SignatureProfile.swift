//
//  SignatureProfile.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignSignatureProfileStatus: String {
    case PUBLISHED = "PUBLISHED"
    case ARCHIVED = "ARCHIVED"
}

struct IgnisignSignatureProfile {
    var _id: String
    var appId: String
    var appEnv: String
    var orgId: String
    var name: String
    var status: IgnisignSignatureProfileStatus
    var integrationMode: IgnisignIntegrationMode
    var signatureMethodRef: IgnisignSignatureMethodRef
    var idProofinfs: [IgnisignIdProofingMethodRef]
    var authMethods: [IgnisignAuthFullMechanismRef]
    var documentTypes: [IgnisignDocumentType]
    var defaultLanguage: IgnisignSignatureLanguages
    var documentRequestActivated: Bool
    var languageCanBeChanged: Bool
    var authSessionEnabled: Bool
    var statementsEnabled: Bool
    var templateDisplayerId: String
    var createdByDefault: String
}

struct IgnisignSignatureProfileStatusWrapper {
    var sttaus: IgnisignSignatureProfileStatus
}

struct IgnisignSignatureProfileSignerInputsConstraints {
    var inputsNeeded: [IgnisignSignerCreationInputRef]
}

struct IgnisignSignatureProfileIdContainerDto {
    var signatureProfileId: String
}
