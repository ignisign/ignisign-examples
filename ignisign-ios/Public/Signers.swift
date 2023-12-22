//
//  Signers.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignSignerEntityType {
    case NATURAL
    case LEGAL
    case VIRTUAL
}

enum IgnisignSignerStatus {
    case CREATED
    case PENDING
    case BLOCKED
    case ACTIVE
}

enum IgnisignSignerCreationInputRef {
    case FIRST_NAME
    case LAST_NAME
    case EMAIL
    case PHONE
    case NATIONALITY
    case BIRTH_DATE
    case BIRTH_PLACE
    case BIRTH_COUNTRY
}

struct IgnisignSigner {
    var _id: String
    var appId: String
    var appEnv: IgnisignApplicationEnv
    var status: IgnisignSignerStatus
    var entityType: IgnisignSignerEntityType
    var _createdAt: Date
    var agreedLegalTerms: Bool
    var certificateDisseminationAgreement: Bool
    var exyernalId: String
}

struct IgnisignSignerCreationRequestDto {
    var signatureProfileId: String
    var firstName: String
    var lastName: String
    var email: String
    var phoneNumnber: String
    var nationality: String
    var birthDate: String
    var birthPlace: String
    var birthCountry: String
    var externalId: String
}

struct IgnisignSignerUpdateRequestDto {
    var signerId: String
    var signatureProfileId: String
    var firstName: String
    var lastName: String
    var email: String
    var phoneNumber: String
    var nationality: String
    var birthDate: String
    var birthPlace: String
    var birthCountry: String
    var externalId: String
}

struct IgnisignSignerCreationResponseDto {
    var signerId: String
    var entityType: [IgnisignSignerSummary]
    var authSecret: String
}

struct IgnisignSignerSearchResultDto {
    var signers: [IgnisignSignerSummary]
    var total: Int
}

class IgnisignSignerSummary {
    var signerId: String?
    var externalId: String?
    var firstName: String?
    var lastName: String?
    var email: String?
    var status: IgnisignSignerStatus?
    var alreadyProvidedInputs: [IgnisignSignerCreationInputRef]?

    init(signerId: String? = nil, externalId: String? = nil, firstName: String? = nil, lastName: String? = nil, email: String? = nil, status: IgnisignSignerStatus? = nil, alreadyProvidedInputs: [IgnisignSignerCreationInputRef]? = nil) {
        self.signerId = signerId
        self.externalId = externalId
        self.firstName = firstName
        self.lastName = lastName
        self.email = email
        self.status = status
        self.alreadyProvidedInputs = alreadyProvidedInputs
    }
}

class IgnisignSignerContext: IgnisignSignerSummary {
    var claims: [Claim]
    var latestSignatureRequests: [IgnisignSignatureRequestWithDocName]

    init(claims: [Claim], latestSignatureRequests: [IgnisignSignatureRequestWithDocName]) {
        self.claims = claims
        self.latestSignatureRequests = latestSignatureRequests
        super.init()
    }

    struct Claim {
        var claimRef: IgnisignSignerClaimRef
        var status: IgnisignSignerClaimStatus
    }
}

