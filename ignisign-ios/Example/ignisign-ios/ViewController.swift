//
//  ViewController.swift
//  ignisign-ios
//
//  Created by Nigdelian on 12/22/2023.
//  Copyright (c) 2023 Nigdelian. All rights reserved.
//

import UIKit
import ignisign_ios
import WebKit

class ViewController: UIViewController, IgnisignJS_SignatureSession_Callbacks {
    
    var ignisign : Ignisign!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let config = WKWebViewConfiguration()
        ignisign = Ignisign(frame: .zero, configuration: config)
        view.addSubview(ignisign)

        NSLayoutConstraint.activate([
            ignisign.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            ignisign.leftAnchor.constraint(equalTo: view.leftAnchor),
            ignisign.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            ignisign.rightAnchor.constraint(equalTo: view.rightAnchor)
        ])
        
        let signatureRequestId = "65854b1d5c7395001c9a5a39"
        let signerId = "6582fc68ef3841001b92e413"
        let signatureSessionToken = "pRC0l2S5SW2VsdWu1xAHr5SY4Q2FpEbYrMEQpbObWUU0jPFSEPxI0bsiCeZWpYv5"
        let signerAuthSecret = "ffbdae8b-8ead-4fed-a601-d4ea62dcda50"
        
        let dimensins = IgnisignSignatureSessionDimensions(width: "400", height: "300")
        let displayOptions = IgnisignJSSignatureSessionsDisplayOptions(showTitle: true, showDescription: true)
        let initParams = IgnisignInitParams(signatureRequestId: signatureRequestId, signerId: signerId, signatureSessionToken: signatureSessionToken, signerAuthToken: signerAuthSecret, sessionCallbacks: self, closeInFinish: true, dimensions: dimensins, displayOptions: displayOptions)
        
        ignisign.setValues(appId: "com.ignisign.ignisign_ios", env: IgnisignApplicationEnv.DEVELOPMENT, ignisignClientSignUrl: "https://sign.ignisign.io")
        ignisign.initSignatureSession(initParams: initParams)
    }
    
    func handlePrivateFileInfoProvisioning(documentId: String, externalDocumentId: String, signerId: String, signatureRequestId: String) {
        print("trace handlePrivateFileInfoProvisioning : documentId : \(documentId) externalDocumentId : \(externalDocumentId) signatureRequestId : \(signatureRequestId)")
    }
    
    func handleSignatureSessionError(errorCode: String, errorContext: Any, signerId: String, signatureRequestId: String) {
        print("trace handleSignatureSessionError : errorCode : \(errorCode) errorContext : \(errorContext) signerId : \(signerId) signatureRequestId : \(signatureRequestId)")
    }
    
    func handleSignatureSessionFinalized(signatureIds: [String], signerId: String, signatureRequestId: String) {
        print("handleSignatureSessionFinalized signatureIds : \(signatureIds) signerId : \(signerId) signatureRequestId : \(signatureRequestId)")
    }
}
