//
//  SignatureRequests.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignSignatureRequestStatementTarget: String {
    case signatureRequest = "SIGNATURE_REQUEST"
    case document = "DOCUMENT"
}

enum IgnisignSignatureRequestDiffusionMode: String {
    case whenReady = "WHEN_READY"
    case scheduled = "SCHEDULED"
}

enum IgnisignSignatureRequestStatus: String {
    case draft = "DRAFT"
    case waitingDocuments = "WAITING_DOCUMENTS"
    case waitingDocumentsGeneration = "WAITING_DOCUMENTS_GENERATION"
    case ready = "READY"
    case inProgress = "IN_PROGRESS"
    case completed = "COMPLETED"
    case expired = "EXPIRED"
    case failed = "FAILED"
    case cancelled = "CANCELLED"
}

let IgnisignSignatureRequestClosedStatus: [IgnisignSignatureRequestStatus] = [.completed, .expired, .failed, .cancelled]

class IgnisignSignatureRequest {
    var id: String?
    var createdAt: Date?
    var appId: String
    var appEnv: IgnisignApplicationEnv
    var signatureProfileId: String
    var title: String?
    var description: String?
    var expirationDate: Date?
    var expirationDateIsActivated: Bool?
    var status: IgnisignSignatureRequestStatus
    var language: IgnisignSignatureLanguages?
    var documentIds: [String]?
    var externalId: String?
    var diffusionMode: IgnisignSignatureRequestDiffusionMode?
    var diffusionDate: Date?
    var signerIds: [String]?
    var signedBy: [String]?
    var isFakeIdProofing: Bool?
    var isIdProofingSession: Bool?
    var isFakeSms: Bool?
    var creatorId: String?
    var templateDisplayerId: String?
    var templateDisplayerVersion: Int?
    
    init(appId: String, appEnv: IgnisignApplicationEnv, signatureProfileId: String, status: IgnisignSignatureRequestStatus) {
            self.appId = appId
            self.appEnv = appEnv
            self.signatureProfileId = signatureProfileId
            self.status = status
        }
}

//enum IgnisignSignatureRequestStatementTarget: String {
//    case signatureRequest = "SIGNATURE_REQUEST"
//    case document = "DOCUMENT"
//}
//
//enum IgnisignSignatureRequestDiffusionMode: String {
//    case whenReady = "WHEN_READY"
//    case scheduled = "SCHEDULED"
//}

enum IgnisignDocumentGeneratedStatus: String {
    case notInitialized = "NOT_INITIALIZED"
    case inProgress = "IN_PROGRESS"
    case waitingImages = "WAITING_IMAGES"
    case onError = "ON_ERROR"
    case created = "CREATED"
}

class IgnisignSignatureRequestStatement {
    var id: String?
    var appId: String
    var appEnv: IgnisignApplicationEnv
    var signatureRequestId: String
    var documentId: String?
    var target: IgnisignSignatureRequestStatementTarget
    var labelMd: String

    init(appId: String, appEnv: IgnisignApplicationEnv, signatureRequestId: String, target: IgnisignSignatureRequestStatementTarget, labelMd: String) {
        self.appId = appId
        self.appEnv = appEnv
        self.signatureRequestId = signatureRequestId
        self.target = target
        self.labelMd = labelMd
    }
}

class IgnisignSignatureRequestUpdateDto {
    var title: String?
    var description: String?
    var expirationDate: Date?
    var expirationDateIsActivated: Bool?
    var language: IgnisignSignatureLanguages?
    var documentIds: [String]?
    var externalId: String?
    var diffusionMode: IgnisignSignatureRequestDiffusionMode?
    var diffusionDate: Date?
    var statements: [IgnisignSignatureRequestStatement]?
    var signerIds: [String]?
}

class IgnisignSignatureRequestIdContainer {
    var signatureRequestId: String?
    
    init(signatureRequestId: String? = nil) {
        self.signatureRequestId = signatureRequestId
    }
}

class IgnisignSignatureRequestPublishBySide: IgnisignSignatureRequestIdContainer {
}

class IgnisignSignatureRequestPublishEmbedded: IgnisignSignatureRequestIdContainer {
    var signers: [Signer]

    struct Signer {
        var signerId: String
        var signerExternalId: String
        var token: String
    }

    init(signatureRequestId: String?, signers: [Signer]) {
        self.signers = signers
        super.init(signatureRequestId: signatureRequestId)
    }
}

class IgnisignSignatureRequestWithDocName: IgnisignSignatureRequest {
    var docFileName: String?
    var docLabel: String?
}

class IgnisignSignatureRequestsPaginate {
    var signatureRequests: [IgnisignSignatureRequestWithDocName]
    var paginationData: PaginationData

    struct PaginationData {
        var total: Int
        var page: Int
        var nbEventsPerPage: Int
    }

    init(signatureRequests: [IgnisignSignatureRequestWithDocName], paginationData: PaginationData) {
        self.signatureRequests = signatureRequests
        self.paginationData = paginationData
    }
}

class IgnisignSignatureRequestContext: IgnisignSignatureRequest {
    var signers: [IgnisignSignerSummary]
    var documents: [IgnisignDocumentContext]
    var statements: [IgnisignSignatureRequestStatement]?
    var signatureProfile: IgnisignSignatureProfile
    var applicationMetadata: IgnisignApplicationSignatureMetadata?
    var signatureProofsUrl: String?
    var signatureProofStatus: IgnisignDocumentGeneratedStatus?

    init(appId: String, appEnv: IgnisignApplicationEnv, signatureProfileId: String, status: IgnisignSignatureRequestStatus, signers: [IgnisignSignerSummary], documents: [IgnisignDocumentContext], signatureProfile: IgnisignSignatureProfile) {
        self.signers = signers
        self.documents = documents
        self.signatureProfile = signatureProfile

        super.init(appId: appId, appEnv: appEnv, signatureProfileId: signatureProfileId, status: status)
    }
}


class IgnisignSignatureRequestIdsContainerDto {
    var signatureRequestIds: [String]

    init(signatureRequestIds: [String]) {
        self.signatureRequestIds = signatureRequestIds
    }
}

class IgnisignSignatureRequestsStatusContainer {
    var signatureRequests: [SignatureRequestStatus]

    struct SignatureRequestStatus {
        var signatureRequestId: String
        var status: IgnisignSignatureRequestStatus
    }

    init(signatureRequests: [SignatureRequestStatus]) {
        self.signatureRequests = signatureRequests
    }
}
