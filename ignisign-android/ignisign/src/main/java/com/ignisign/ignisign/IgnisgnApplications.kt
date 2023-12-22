package com.ignisign.ignisign

import com.ignisign.ignisign.public.IgnisignSignatureProfile
import java.util.*

enum class IgnisignApplicationStatus {
    ACTIVE,
    BLOCKED,
    ARCHIVED,
    ORG_ARCHIVED
}

enum class IgnisignApplicationEnv {
    DEVELOPMENT,
    STAGING,
    PRODUCTION
}

data class IgnisignApplication(
    val _createdAt: Date? = null,
    val appId: String? = null,
    val orgId: String,
    val appName: String,
    val status: IgnisignApplicationStatus
)

data class IgnisignApplicationContext(
    val ignisignApplication: IgnisignApplication,
    val config: IgnisignApplicationConfiguration,
    val envSettings: Map<IgnisignApplicationEnv, IgnisignApplicationEnvSettings>,
    val settings: IgnisignApplicationSettings,
    val signatureProfiles: Map<IgnisignApplicationEnv, List<IgnisignSignatureProfile>>
)
