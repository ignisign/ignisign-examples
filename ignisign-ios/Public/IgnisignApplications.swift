//
//  IgnisignApplications.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

enum IgnisignApplicationStatus: String {
    case ACTIVE = "ACTIVE"
    case BLOCKED = "BLOCKED"
    case ARCHIVED = "ARCHIVED"
    case ORG_ARCHIVED = "ORG_ARCHIVED"
}

public enum IgnisignApplicationEnv: String, Decodable {
    case DEVELOPMENT = "DEVELOPMENT"
    case STAGING = "STAGING"
    case PRODUCTION = "PRODUCTION"
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
