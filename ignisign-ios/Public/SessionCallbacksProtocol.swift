//
//  SessionCallbacksProtocol.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 22/12/2023.
//

import Foundation

public protocol IgnisignJS_SignatureSession_Callbacks {
    func handlePrivateFileInfoProvisioning(documentId: String, externalDocumentId: String, signerId: String, signatureRequestId: String)
    func handleSignatureSessionError(errorCode: String, errorContext: Any, signerId: String, signatureRequestId: String)
    func handleSignatureSessionFinalized(signatureIds: [String], signerId: String, signatureRequestId: String)
}
