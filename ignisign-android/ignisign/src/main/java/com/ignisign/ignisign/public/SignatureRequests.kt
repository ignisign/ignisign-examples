package com.ignisign.ignisign.public

import com.ignisign.ignisign.IgnisignApplicationEnv
import com.ignisign.ignisign.IgnisignSignatureLanguages
import java.util.*

enum class IgnisignSignatureRequestStatementTarget {
    SIGNATURE_REQUEST,
    DOCUMENT
}

enum class IgnisignSignatureRequestDiffusionMode {
    WHEN_READY,
    SCHEDULED
}

enum class IgnisignSignatureRequestStatus {
    DRAFT,
    WAITING_DOCUMENTS,
    WAITING_DOCUMENTS_GENERATION,
    READY,
    IN_PROGRESS,
    COMPLETED,
    EXPIRED,
    FAILED,
    CANCELLED
}

enum class IgnisignDocumentGeneratedStatus {
    NOT_INITIALIZED,
    IN_PROGRESS,
    WAITING_IMAGES,
    ON_ERROR,
    CREATED
}

val IGNISIGN_SIGNATURE_REQUEST_CLOSED_STATUS = listOf(
    IgnisignSignatureRequestStatus.COMPLETED,
    IgnisignSignatureRequestStatus.EXPIRED,
    IgnisignSignatureRequestStatus.FAILED
)

open class IgnisignSignatureRequest(
    val _id: String? = null,
    val _createdAt: Date? = null,
    val appId: String,
    val appEnv: IgnisignApplicationEnv,
    val signatureProfileId: String,
    val title: String? = null,
    val description: String? = null,
    val expirationDate: Date? = null,
    val expirationDateIsActivated: Boolean? = null,
    val status: IgnisignSignatureRequestStatus,
    val language: IgnisignSignatureLanguages? = null,
    val documentIds: List<String>? = null,
    val externalId: String? = null,
    val diffusionMode: IgnisignSignatureRequestDiffusionMode? = null,
    val diffusionDate: Date? = null,
    val signerIds: List<String>? = null,
    val signedBy: List<String>? = null,
    val isFakeIdProofing: Boolean? = null,
    val isIdProofingSession: Boolean? = null,
    val isFakeSms: Boolean? = null,
    val creatorId: String? = null,
    val templateDisplayerId: String? = null,
    val templateDisplayerVersion: Number? = null
)

data class IgnisignSignatureRequestStatement(
    val _id: String? = null,
    val appId: String,
    val appEnv: IgnisignApplicationEnv,
    val signatureRequestId: String,
    val documentId: String? = null,
    val target: IgnisignSignatureRequestStatementTarget,
    val labelMd: String
)

class IgnisignSignatureRequestWithDocName(
    val docFileName: String? = null,
    val docLabel: String? = null,

    _id: String? = null,
    _createdAt: Date? = null,
    appId: String,
    appEnv: IgnisignApplicationEnv,
    signatureProfileId: String,
    title: String? = null,
    description: String? = null,
    expirationDate: Date? = null,
    expirationDateIsActivated: Boolean? = null,
    status: IgnisignSignatureRequestStatus,
    language: IgnisignSignatureLanguages? = null,
    documentIds: List<String>? = null,
    externalId: String? = null,
    diffusionMode: IgnisignSignatureRequestDiffusionMode? = null,
    diffusionDate: Date? = null,
    signerIds: List<String>? = null,
    signedBy: List<String>? = null,
    isFakeIdProofing: Boolean? = null,
    isIdProofingSession: Boolean? = null,
    isFakeSms: Boolean? = null,
    creatorId: String? = null,
    templateDisplayerId: String? = null,
    templateDisplayerVersion: Number? = null

) : IgnisignSignatureRequest(_id, _createdAt, appId, appEnv, signatureProfileId, title, description, expirationDate, expirationDateIsActivated, status, language, documentIds, externalId, diffusionMode, diffusionDate, signerIds, signedBy, isFakeIdProofing, isIdProofingSession, isFakeSms, creatorId, templateDisplayerId, templateDisplayerVersion)

