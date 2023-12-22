//
//  IgnisignApplicationConfiguration.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 19/12/2023.
//

import Foundation

struct IgnisignApplicationConfiguration {
    var appId: String
    var orgId: String
}

struct IgnisignApplicationEnvSettings {
    var appId: String
    var orgId: String
    var appEnv: IgnisignApplicationEnv
    var webhookds: [IgnisignWebhookSettingsDescription]
    var appRootUrl: String
    var authorizedRedirectionUrls: [String]
    var isApiKeyGenerated: Bool
    var defaultSignatureProfileId: String
}

struct IgnisignWebhookSettingsDescription {
    var _id: String
    var _createdAt: Date
    var url: String
    var description: String
}

struct IgnisignApplicationSettings {
    var appId: String
    var orgId: String
    var defaultLanguage: String
    var customerSupportEmail: String
    var logoB64: String
    var logoDarkB64: String
    var primaryColor: IgnisignApplicationVariationColor
    var secondaryColor: IgnisignApplicationVariationColor
}

struct IgnisignApplicationVariationColor {
    var _50: String
    var _100: String
    var _200: String
    var _300: String
    var _400: String
    var _500: String
    var _600: String
    var _700: String
    var _800: String
    var _900: String
    var _A100: String
    var _A200: String
    var _A300: String
    var _A400: String
    var _A700: String
}
