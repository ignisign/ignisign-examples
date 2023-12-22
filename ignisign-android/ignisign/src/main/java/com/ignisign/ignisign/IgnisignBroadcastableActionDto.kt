package com.ignisign.ignisign

enum class IgnisignBroadcastableActions {
    NEED_PRIVATE_FILE_URL, OPEN_URL, SIGNATURE_FINALIZED, SIGNATURE_ERROR
}

data class IgnisignBroadcastableActionPrivateFileRequestDto(
    val type: IgnisignBroadcastableActions = IgnisignBroadcastableActions.NEED_PRIVATE_FILE_URL,
    val data: PrivateFileRequestData
) {
    data class PrivateFileRequestData(
        val documentId: String,
        val externalDocumentId: String? = null
    )
}

data class IgnisignBroadcastableActionOpenUrlRequestDto(
    val type: IgnisignBroadcastableActions = IgnisignBroadcastableActions.OPEN_URL,
    val data: OpenUrlRequestData
) {
    data class OpenUrlRequestData(
        val url: String
    )
}

data class IgnisignBroadcastableActionSignatureFinalizedDto(
    val type: IgnisignBroadcastableActions = IgnisignBroadcastableActions.SIGNATURE_FINALIZED,
    val data: SignatureFinalizedData
) {
    data class SignatureFinalizedData(
        val signatureIds: List<String>
    )
}

data class IgnisignBroadcastableActionSignatureErrorDto(
    val type: IgnisignBroadcastableActions = IgnisignBroadcastableActions.SIGNATURE_ERROR,
    val data: SignatureErrorData
) {
    data class SignatureErrorData(
        val errorCode: String,//IgnisignErrorCodes,
        val errorContext: Any? = null
    )
}

sealed class IgnisignBroadcastableActionDto {
    data class PrivateFileRequest(val dto: IgnisignBroadcastableActionPrivateFileRequestDto) : IgnisignBroadcastableActionDto()
    data class OpenUrlRequest(val dto: IgnisignBroadcastableActionOpenUrlRequestDto) : IgnisignBroadcastableActionDto()
    data class SignatureFinalized(val dto: IgnisignBroadcastableActionSignatureFinalizedDto) : IgnisignBroadcastableActionDto()
    data class SignatureError(val dto: IgnisignBroadcastableActionSignatureErrorDto) : IgnisignBroadcastableActionDto()
}

