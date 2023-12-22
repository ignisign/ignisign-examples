//
//  IgnisignApplications.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignApplicationStatus {
    case ACTIVE
    case BLOCKED
    case ARCHIVED
    case ORG_ARCHIVED
}

public enum IgnisignApplicationEnv {
    case DEVELOPMENT
    case STAGING
    case PRODUCTION
}

struct IgnisignApplication {
    var createdAt: Date
    var appId: String
    var orgId: String
    var appName: String
    var status: IgnisignApplicationStatus
}

struct IgnisignApplicationContext {
    var ignisignApplication: IgnisignApplication
    var config: IgnisignApplicationConfiguration
    var envSettings: [IgnisignApplicationEnv:IgnisignApplicationEnvSettings]
    var settings: IgnisignApplicationSettings
    var signatureProfiles: [IgnisignApplicationEnv : [IgnisignSignatureProfile]]
}
