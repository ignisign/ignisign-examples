//
//  Config.swift
//  ignisign-ios_Example
//
//  Created by Marc Nigdélian on 22/12/2023.
//  Copyright © 2023 CocoaPods. All rights reserved.
//

import Foundation

class Config {
    static let shared = Config()
    let baseURL: String
    private init() {
        self.baseURL = "http://localhost:4242"
    }
}
