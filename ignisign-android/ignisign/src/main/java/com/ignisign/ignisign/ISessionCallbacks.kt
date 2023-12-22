package com.ignisign.ignisign

interface ISessionCallbacks {
    fun handlePrivateFileInfoProvisioning(documentId: String, externalDocumentId: String, signerId: String, signatureRequestId: String)//: Deferred<IgnisignDocumentPrivateFileDto>
    fun handleSignatureSessionError(errorCode: String, errorContext: Any, signerId: String, signatureRequestId: String)//: Deferred<Void>
    fun handleSignatureSessionFinalized(signatureIds: List<String>, signerId: String, signatureRequestId: String)//: Deferred<Void>
}