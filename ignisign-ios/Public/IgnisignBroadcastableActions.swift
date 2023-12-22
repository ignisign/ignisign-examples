//
//  IgnisignBroadcastableActionPrivateFileDto.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 22/12/2023.
//

import Foundation

import Foundation

enum IgnisignBroadcastableActions: String {
    case needPrivateFileUrl = "NEED_PRIVATE_FILE_URL"
    case openUrl = "OPEN_URL"
    case signatureFinalized = "SIGNATURE_FINALIZED"
    case signatureError = "SIGNATURE_ERROR"
}

struct IgnisignBroadcastableActionPrivateFileRequestDto {
    var type: IgnisignBroadcastableActions = .needPrivateFileUrl
    var data: PrivateFileRequestData
    
    struct PrivateFileRequestData {
        var documentId: String
        var externalDocumentId: String
    }
}

struct IgnisignBroadcastableActionOpenUrlRequestDto {
    var type: IgnisignBroadcastableActions = .openUrl
    var data: OpenUrlRequestData
    
    struct OpenUrlRequestData {
        var url: String
    }
}

struct IgnisignBroadcastableActionSignatureFinalizedDto {
    var type: IgnisignBroadcastableActions = .signatureFinalized
    var data: SignatureFinalizedData
    
    struct SignatureFinalizedData {
        var signatureIds: [String]
    }
}

struct IgnisignBroadcastableActionSignatureErrorDto {
    var type: IgnisignBroadcastableActions = .signatureError
    var data: SignatureErrorData
    
    struct SignatureErrorData {
        var errorCode: String
        var errorContext: Any?
    }
}

enum IgnisignBroadcastableActionDto {
    case privateFileRequest(dto: IgnisignBroadcastableActionPrivateFileRequestDto)
    case openUrlRequest(dto: IgnisignBroadcastableActionOpenUrlRequestDto)
    case signatureFinalized(dto: IgnisignBroadcastableActionSignatureFinalizedDto)
    case signatureError(dto: IgnisignBroadcastableActionSignatureErrorDto)
}
