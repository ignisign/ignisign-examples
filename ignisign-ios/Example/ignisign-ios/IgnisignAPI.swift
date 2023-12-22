//
//  IgnisignAPI.swift
//  ignisign-ios_Example
//
//  Created by Marc Nigdélian on 22/12/2023.
//  Copyright © 2023 CocoaPods. All rights reserved.
//

import Foundation

class IgnisignAPI {
    let baseURL = Config.shared.baseURL

    func fetchContractContexts(completion: @escaping ([ContractContext]?, Error?) -> Void) {
        let urlString = "\(baseURL)/v1/contract-to-sign-contexts"
        guard let url = URL(string: urlString) else {
            completion(nil, NSError(domain: "APIClientError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"]))
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            guard error == nil else {
                completion(nil, error)
                return
            }

            guard let data = data else {
                completion(nil, NSError(domain: "APIClientError", code: -2, userInfo: [NSLocalizedDescriptionKey: "No data received"]))
                return
            }

            do {
                let contractContexts = try JSONDecoder().decode([ContractContext].self, from: data)
                completion(contractContexts, nil)
            } catch {
                completion(nil, error)
            }
        }
        task.resume()
    }
}
