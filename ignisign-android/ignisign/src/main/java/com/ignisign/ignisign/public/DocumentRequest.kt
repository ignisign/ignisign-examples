package com.ignisign.ignisign.public

import com.ignisign.ignisign.IgnisignApplicationEnv

enum class IgnisignDocumentRequestTarget {
    APPLICATION,
    USER
}

enum class IgnisignDocumentRequestStatus {
    CREATED,
    IN_PROGRESS,
    PROVIDED,
    WAITING_CONFIRMATION,
    CANCELLED,
    VALIDATED,
    REJECTED
}

data class IgnisignDocumentRequest(
    val _id: String? = null,
    val appId: String,
    val appEnv: IgnisignApplicationEnv,
    val target: IgnisignDocumentRequestTarget,
    val status: IgnisignDocumentRequestStatus,
    val signatureRequestId: String,
    val documentId: String,
    val externalId: String? = null,
    val user: User? = null
) {
    data class User(
        val firstName: String? = null,
        val lastName: String? = null,
        val email: String
    )
}

data class IgnisignDocumentRequestRequestDto(
    val target: IgnisignDocumentRequestTarget,
    val documentId: String,
    val externalId: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null
)



