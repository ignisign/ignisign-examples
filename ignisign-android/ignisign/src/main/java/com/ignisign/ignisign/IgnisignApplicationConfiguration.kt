package com.ignisign.ignisign

import java.util.*

data class IgnisignApplicationConfiguration(
    val appId: String,
    val orgId: String
)

data class IgnisignApplicationEnvSettings(
    val appId: String,
    val orgId: String,
    val appEnv: IgnisignApplicationEnv,
    val webhooks: List<IgnisignWebhookSettingsDescription>,
    val appRootUrl: String? = null,
    val authorizedRedirectionUrls: List<String>,
    val isApiKeyGenerated: Boolean? = null,
    val defaultSignatureProfileId: String? = null
)

data class IgnisignWebhookSettingsDescription(
    val _id: String? = null,
    val _createdAt: Date? = null,
    val url: String,
    val description: String? = null
)

data class IgnisignApplicationSettings(
    val appId: String,
    val orgId: String,
    val defaultLanguage: IgnisignSignatureLanguages? = null,
    val customerSupportEmail: String? = null,
    val logoB64: String? = null,
    val logoDarkB64: String? = null,
    val primaryColor: IgnisignApplicationVariationColor? = null,
    val secondaryColor: IgnisignApplicationVariationColor? = null
)

data class IgnisignApplicationVariationColor(
    val _50: String,
    val _100: String,
    val _200: String,
    val _300: String,
    val _400: String,
    val _500: String,
    val _600: String,
    val _700: String,
    val _800: String,
    val _900: String,
    val A100: String,
    val A200: String,
    val A400: String,
    val A700: String
)
