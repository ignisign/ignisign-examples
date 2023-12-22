//
//  ContractContext.swift
//  ignisign-ios_Example
//
//  Created by Marc Nigdélian on 22/12/2023.
//  Copyright © 2023 CocoaPods. All rights reserved.
//

import Foundation
import ignisign_ios

struct ContractContext: Decodable {
    let signatureRequestId: String
    let ignisignSignerId: String
    let ignisignSignatureToken: String
    let ignisignUserAuthSecret: String
    let ignisignAppId: String
    let ignisignAppEnv: IgnisignApplicationEnv
    let signerEmail: String?
    let documentId: String?
}
