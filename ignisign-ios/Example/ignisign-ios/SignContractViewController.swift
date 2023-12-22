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

class SignContractViewController: UIViewController, IgnisignJS_SignatureSession_Callbacks {
    
    var ignisign : Ignisign!
    
    var signatureRequestId = ""
    var signerId = ""
    var signatureSessionToken = ""
    var signerAuthSecret = ""
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
//        navigationController?.navigationBar.barTintColor = UIColor.white
//        navigationController?.navigationBar.isTranslucent = false
        
        let config = WKWebViewConfiguration()
        ignisign = Ignisign(frame: .zero, configuration: config)
        view.addSubview(ignisign)

        NSLayoutConstraint.activate([
            ignisign.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            ignisign.leftAnchor.constraint(equalTo: view.leftAnchor),
            ignisign.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            ignisign.rightAnchor.constraint(equalTo: view.rightAnchor)
        ])
        
        let dimensins = IgnisignSignatureSessionDimensions(width: "400", height: "300")
        let displayOptions = IgnisignJSSignatureSessionsDisplayOptions(showTitle: true, showDescription: true)
        let initParams = IgnisignInitParams(signatureRequestId: signatureRequestId, signerId: signerId, signatureSessionToken: signatureSessionToken, signerAuthToken: signerAuthSecret, sessionCallbacks: self, closeInFinish: true, dimensions: dimensins, displayOptions: displayOptions)
        
        ignisign.setValues(appId: "com.ignisign.ignisign_ios", env: IgnisignApplicationEnv.DEVELOPMENT, ignisignClientSignUrl: "https://sign.ignisign.io")
        ignisign.initSignatureSession(initParams: initParams)
    }
    
    func handlePrivateFileInfoProvisioning(documentId: String, externalDocumentId: String, signerId: String, signatureRequestId: String) {
        //print("trace handlePrivateFileInfoProvisioning : documentId : \(documentId) externalDocumentId : \(externalDocumentId) signatureRequestId : \(signatureRequestId)")
        showAlert(title: "handlePrivateFileInfoProvisioning", message: "documentId: \(documentId) - externalDocumentId : \(externalDocumentId) - signatureRequestId : \(signatureRequestId)")
    }
    
    func handleSignatureSessionError(errorCode: String, errorContext: Any, signerId: String, signatureRequestId: String) {
        //print("trace handleSignatureSessionError : errorCode : \(errorCode) errorContext : \(errorContext) signerId : \(signerId) signatureRequestId : \(signatureRequestId)")
        showAlert(title: "handlePrivateFileInfoProvisioning", message: "errorCode : \(errorCode) - signerId: \(signerId) - signatureRequestId : \(signatureRequestId)")
    }
    
    func handleSignatureSessionFinalized(signatureIds: [String], signerId: String, signatureRequestId: String) {
        showAlert(title: "handlePrivateFileInfoProvisioning", message: "signatureIds : \(signatureIds) - signerId : \(signerId) - signatureRequestId : \(signatureRequestId)")
        //print("handleSignatureSessionFinalized signatureIds : \(signatureIds) signerId : \(signerId) signatureRequestId : \(signatureRequestId)")
    }
    
    func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        self.present(alert, animated: true, completion: nil)
    }
}
