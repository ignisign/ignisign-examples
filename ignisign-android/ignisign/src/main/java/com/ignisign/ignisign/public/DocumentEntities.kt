package com.ignisign.ignisign.public

import com.ignisign.ignisign.IgnisignApplicationEnv
import java.util.*

enum class IgnisignDocumentType {
    PDF,
    FILE,
    DATA_JSON,
    PRIVATE_FILE
}

enum class IgnisignDocumentStatus {
    CREATED,
    DOCUMENT_REQUEST,
    PROVIDED,
    ARCHIVED
}

enum class GetPrivateFileErrors {
    DOCUMENT_HASH_DOES_NOT_MATCH_PROVIDED_ONE,
    NOT_AUTHORIZED_TO_GET,
    CANNOT_GET_FILE
}

data class IgnisignDocument(
    val _id: String? = null,
    val appId: String,
    val appEnv: IgnisignApplicationEnv,
    val documentNature: IgnisignDocumentType,
    val status: IgnisignDocumentStatus,
    val documentHash: String,
    val signatureRequestId: String,
    val documentRequestId: String? = null,
    val externalId: String? = null,
    val label: String? = null,
    val description: String? = null,
    val fileName: String? = null,
    val fileSize: Number? = null,
    val mimeType: String? = null,
    val dataJsonContent: String? = null,
    val relatedDocumentId:  String? = null,
    val relatedDocumentType: IgnisignDocumentType? = null,
    val _createdAt: Date? = null
)

data class IgnisignDocumentContainer(
    val document: IgnisignDocument
)

data class IgnisignDocumentContext(
    val ignisignDocument: IgnisignDocument,
    val statements: List<IgnisignSignatureRequestStatement>? = null,
    val documentRequest: IgnisignDocumentRequest? = null,
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

