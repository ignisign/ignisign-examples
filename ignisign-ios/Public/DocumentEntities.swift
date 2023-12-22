//
//  DocumentEntities.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignDocumentType {
    case PDF
    case FILE
    case DATA_JSON
    case PRIVATE_FILE
}

enum IgnisignDocumentStatus {
    case CREATED
    case DOCUMENT_REQUEST
    case PROVIDED
    case ARCHIVED
}

enum GetPrivateFileErrors {
    case DOCUMENT_HASH_DOES_NOT_MATCH_PROVIDED_ONE
    case NOT_AUTHORIZED_TO_GET
    case CANNOT_GET_FILE
}

struct IgnisignDocument {
    var _id: String
    var appId: String
    var appEnv: IgnisignApplicationEnv
    var documentNature: IgnisignDocumentType
    var status: IgnisignDocumentStatus
    var documentHash: String
    var signatureRequestId: String
    var documentRequestId: String
    var externalId: String
    var label: String
    var description: String
    var fileName: String
    var fileSize: String
    var mimeType: String
    var dataJsonContent: String
    var relatedDocumentId: String
    var relatedDocumentType: String
    var createdAt: Date
}

struct IgnisignDocumentContainer {
    var document: IgnisignDocument
}

struct IgnisignDocumentContext {
    var ignisignDocument: IgnisignDocument
    //var statements: [
}

/*
 data class IgnisignDocumentContext(
     val ignisignDocument: IgnisignDocument,
     val statements: List<IgnisignSignatureRequestStatement>? = null, // Type à définir
     val documentRequest: IgnisignDocumentRequest? = null, // Type à définir
     val signatureSummaries: List<SignatureSummary>
 ) {
     data class SignatureSummary(
         val signatureId: String,
         val signerId: String,
         val date: Date
     )
 }

 data class IgnisignDocumentInitializationDto(
     val signatureRequestId: String,
     val externalId: String? = null,
     val label: String? = null,
     val description: String? = null
 )

 data class IgnisignDocumentUpdateDto(
     val externalId: String? = null,
     val label: String? = null,
     val description: String? = null
 )


 */
