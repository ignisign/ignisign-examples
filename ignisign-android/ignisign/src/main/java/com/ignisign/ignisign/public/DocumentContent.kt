package com.ignisign.ignisign.public

data class IgnisignDocumentContentCreationDataJsonDto(
    val jsonContent: Any
)

data class IgnisignDocumentContentCreationPrivateContentDto(
    val documentHash: String
)

data class IgnisignDocumentPrivateFileDto(
    val documentId: String? = null,
    val fileUrl: String,
    val mimeType: String,
    val fileName: String,
    val bearer: String? = null
)