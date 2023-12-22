package com.ignisign.ignisign.public

import com.ignisign.ignisign.IgnisignApplicationEnv
import java.util.*

enum class IgnisignSignerEntityType {
    NATURAL,
    LEGAL,
    VIRTUAL
}

enum class IgnisignSignerStatus {
    CREATED,
    PENDING,
    BLOCKED,
    ACTIVE
}

enum class IgnisignSignerCreationInputRef {
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    PHONE,
    NATIONALITY,
    BIRTH_DATE,
    BIRTH_PLACE,
    BIRTH_COUNTRY
}

data class IgnisignSigner(
    val _id: String? = null,
    val appId: String,
    val appEnv: IgnisignApplicationEnv,
    val status: IgnisignSignerStatus,
    val entityType: IgnisignSignerEntityType,
    val _createdAt: Date? = null,
    val agreedLegalTerms: Boolean? = null,
    val certificateDisseminationAgreement: Boolean? = null,
    val externalId: String? = null
)

data class IgnisignSignerCreationRequestDto(
    val signatureProfileId: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val phoneNumber: String? = null,
    val nationality: String? = null,
    val birthDate: String? = null,
    val birthPlace: String? = null,
    val birthCountry: String? = null,
    val externalId: String? = null
)

data class IgnisignSignerUpdateRequestDto(
    val signerId: String? = null,
    val signatureProfileId: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val phoneNumber: String? = null,
    val nationality: String? = null,
    val birthDate: String? = null,
    val birthPlace: String? = null,
    val birthCountry: String? = null,
    val externalId: String? = null
)


data class IgnisignSignerCreationResponseDto(
    val signerId: String,
    val entityType: IgnisignSignerEntityType,
    val authSecret: String? = null
)

data class IgnisignSignersSearchResultDto(
    val signers: List<IgnisignSignerSummary>,
    val total: Int
)

open class IgnisignSignerSummary(
    val signerId: String? = null,
    val externalId: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val status: IgnisignSignerStatus? = null,
    val alreadyProvidedInputs: List<IgnisignSignerCreationInputRef>? = null
)

data class IgnisignSignerContext(
    val claims: List<Claim>,
    val latestSignatureRequests: List<IgnisignSignatureRequestWithDocName>
) : IgnisignSignerSummary() {
    data class Claim(
        val claimRef: IgnisignSignerClaimRef,
        val status: IgnisignSignerClaimStatus
    )
}
