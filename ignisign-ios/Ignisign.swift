//
//  Ignisign.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 22/12/2023.
//

import Foundation
import WebKit

public class Ignisign:  WKWebView, WKScriptMessageHandler, WKNavigationDelegate {
    var ignisignClientSignUrlDefault = "https://sign.ignisign.io"
    let IFRAME_MIN_HEIGHT: Int = 400
    let IFRAME_MIN_WIDTH: Int = 300
    var appId: String?
    var env: IgnisignApplicationEnv?
    var ignisignClientSignUrl: String?
    var debug = false
    
    var signerId: String?
    var signatureRequestId: String?
    var closeOnFinish: Bool = true
    var signerAuthToken: String?
    var sessionCallbacks: IgnisignJS_SignatureSession_Callbacks?
    var displayOptions: IgnisignJSSignatureSessionsDisplayOptions?
    var signatureSessionToken: String?
    var signatureAuthToken: String?
    var dimensions: IgnisignSignatureSessionDimensions?
    
    private func debugPrint(message: String) {
        if debug {
            print(message)
        }
    }
    
    required public init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    override public init(frame: CGRect, configuration: WKWebViewConfiguration) {
        super.init(frame: frame, configuration: configuration)
        initWebView(config: configuration)
    }
    
    func initWebView(config: WKWebViewConfiguration) {
        
        let contentController = config.userContentController
        contentController.add(self, name: "message")
        navigationDelegate = self
        translatesAutoresizingMaskIntoConstraints = false
    }
    
    public func setValues(appId: String, env: IgnisignApplicationEnv, ignisignClientSignUrl: String? = nil) {
        self.appId = appId
        self.env = env
        if (ignisignClientSignUrl != nil) {
            self.ignisignClientSignUrl = ignisignClientSignUrl!
        } else {
            self.ignisignClientSignUrl = ignisignClientSignUrlDefault
        }
    }
    
    public func initSignatureSession(initParams: IgnisignInitParams) {
        print("trace ignisign ios - init Signature session called : \(initParams)")
        signerId = initParams.signerId
        signatureRequestId = initParams.signatureRequestId
        closeOnFinish = initParams.closeInFinish
        displayOptions = initParams.displayOptions
        signerAuthToken = initParams.signerAuthToken
        signatureSessionToken = initParams.signatureSessionToken
        sessionCallbacks = initParams.sessionCallbacks
        dimensions = initParams.dimensions
        
        if let signatureRequestId = signatureRequestId,
           let signerId = signerId,
           let signatureSessionToken = signatureSessionToken,
            let signerAuthSecret = signerAuthToken,
            let displayOptions = displayOptions {
            let signatureSessionLink = getUrlSessionLink(signatureRequestId: signatureRequestId, signerId: signerId, signatureSessionToken: signatureSessionToken, signerAuthSecret: signerAuthSecret, displayOptions: displayOptions)
            print("trace ignisign ios - init Signature session called load webview : \(signatureSessionLink)")
            load(URLRequest(url: URL(string: signatureSessionLink)!))
        } else {
            print("trace ignisign ios - values nil")
        }
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
       let jsCode = """
       (function() {
           function receiveMessage(event) {
               window.webkit.messageHandlers.message.postMessage(JSON.stringify(event.data));
           }
           window.addEventListener("message", receiveMessage, false);
       })()
       """
       webView.evaluateJavaScript(jsCode, completionHandler: nil)
   }

   public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
       if message.name == "message", let messageBody = message.body as? String {
           handleEvent(message: messageBody)
       }
   }
    
    private func handleEvent(message: String) {
        print("Message received from JS: \(message)")
        if let args = jsonToMap(json: message) {
            if let type = args["type"] as? String {
                if let data = args["data"] as? [String: Any] {
                    if type == "NEED_PRIVATE_FILE_URL" {
                        print("trace callback - need private file url")
                        managePrivateFileInfoProvisioning(data: data)
                    } else if type == "OPEN_URL" {
                        if let url = data["url"] as? String {
                            load(URLRequest(url: URL(string:url)!))
                        }
                    } else if type == "SIGNATURE_FINALIZED" {
                        print("trace callback - signature finalized")
                        finalizeSignatureRequest(data: data)
                    } else if type == "SIGNATURE_ERROR" {
                        print("trace callback - signature error")
                        manageSignatureRequestError(data: data)
                    }
                }
            }
            else if (args["type"] != nil && (args["data"] == nil || ((args["data"] as? [String: Any]) == nil))) {
               
           }
        }
    }
    
    private func managePrivateFileInfoProvisioning(data: [String: Any]) {
        let documentId = data["documentId"] as? String
        let externalDocumentId = data["externalDocumentId"] as? String

        if let documentId = documentId, let externalDocumentId = externalDocumentId, let signerId = signerId, let signatureRequestId = signatureRequestId {
            sessionCallbacks?.handlePrivateFileInfoProvisioning(documentId: documentId, externalDocumentId: externalDocumentId, signerId: signerId, signatureRequestId: signatureRequestId)
        }

        if closeOnFinish {
            closeIFrame()
        }
    }

    private func finalizeSignatureRequest(data: [String: Any]) {
        if let signatureIds = data["signatureIds"] as? [String], let signerId = signerId, let signatureRequestId = signatureRequestId {
            sessionCallbacks?.handleSignatureSessionFinalized(signatureIds: signatureIds, signerId: signerId, signatureRequestId: signatureRequestId)
        }

        if closeOnFinish {
            closeIFrame()
        }
    }

    private func manageSignatureRequestError(data: [String: Any]) {
        let errorCode = data["errorCode"] as? String
        let errorContext = data["errorContext"] as? Any
        
        print("errorCode : \(errorCode)")
        print("errorContext : \(errorContext)")
        print("signerId : \(signerId)")
        print("signatureRequestId : \(signatureRequestId)")

        if let errorCode = errorCode, let errorContext = errorContext, let signerId = signerId, let signatureRequestId = signatureRequestId {
            sessionCallbacks?.handleSignatureSessionError(errorCode: errorCode, errorContext: errorContext, signerId: signerId, signatureRequestId: signatureRequestId)
        }

        if closeOnFinish {
            closeIFrame()
        }
    }

    private func checkIfFrameIsTooSmall() { //todo fix
        let jsCode = """
            function checkIfIframeIsTooSmall() {
                var docElement = document.documentElement;
                if (docElement.offsetHeight < \(IFRAME_MIN_HEIGHT) || docElement.offsetWidth < \(IFRAME_MIN_WIDTH)) {
                    window.webkit.messageHandlers.onIframeTooSmall.postMessage({width: docElement.offsetWidth, height: docElement.offsetHeight});
                } else {
                    window.webkit.messageHandlers.onIframeTooSmall.postMessage({width: docElement.offsetWidth, height: docElement.offsetHeight});
                }
            }
            checkIfIframeIsTooSmall();
        """
    
        evaluateJavaScript(jsCode, completionHandler: nil)
    }

    
    private func closeIFrame() {
        load(URLRequest(url: URL(string: "about:blank")!))
    }
    
    func getUrlSessionLink(signatureRequestId: String, signerId: String, signatureSessionToken: String, signerAuthSecret: String, displayOptions: IgnisignJSSignatureSessionsDisplayOptions) -> String {
            return "\(ignisignClientSignUrl!)/signature-requests/\(signatureRequestId)/signers/\(signerId)/sign?token=\(signatureSessionToken)&signerSecret=\(signerAuthSecret)&\(displayOptions.convertToQueryString())"
        }
    
    func jsonToMap(json: String) -> [String: Any]? {
        if let data = json.data(using: .utf8) {
            do {
                return try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
            } catch {
                print("Erreur lors de la conversion du JSON en map: \(error)")
            }
        }
        return nil
    }
}

public struct IgnisignJSSignatureSessionsDisplayOptions {
    var showTitle: Bool
    var showDescription: Bool
    var darkMode: Bool = false
    var forceLanguage = "FR"
    var forceShowDocumentInformations: Bool = false
    
    public init(showTitle: Bool, showDescription: Bool, darkMode: Bool = false, forceLanguage: String = "FR", forceShowDocumentInformations: Bool = false) {
        self.showTitle = showTitle
        self.showDescription = showDescription
        self.darkMode = darkMode
        self.forceLanguage = forceLanguage
        self.forceShowDocumentInformations = forceShowDocumentInformations
    }

    func convertToQueryString() -> String {
        let propertiesMap: [String: Any?] = [
            "showTitle": showTitle,
            "showDescription": showDescription,
            "darkMode": darkMode,
            "forceLanguage": forceLanguage,
            "forceShowDocumentInformations": forceShowDocumentInformations
        ]

        let queryString = propertiesMap.compactMap { key, value -> String? in
            guard let value = value else { return nil }
            return "\(key)=\(value)"
        }.joined(separator: "&")

        return queryString
    }
}

public struct IgnisignSignatureSessionDimensions {
    var width: String
    var height: String
    
    public init(width: String, height: String) {
        self.width = width
        self.height = height
    }
}

public struct IgnisignInitParams {
    var signatureRequestId: String
    var signerId: String
    var signatureSessionToken: String
    var signerAuthToken: String
    var sessionCallbacks: IgnisignJS_SignatureSession_Callbacks
    var closeInFinish: Bool
    var dimensions: IgnisignSignatureSessionDimensions
    var displayOptions: IgnisignJSSignatureSessionsDisplayOptions
    
    public init(signatureRequestId: String, signerId: String, signatureSessionToken: String, signerAuthToken: String, sessionCallbacks: IgnisignJS_SignatureSession_Callbacks, closeInFinish: Bool, dimensions: IgnisignSignatureSessionDimensions, displayOptions: IgnisignJSSignatureSessionsDisplayOptions) {
        self.signatureRequestId = signatureRequestId
        self.signerId = signerId
        self.signatureSessionToken = signatureSessionToken
        self.signerAuthToken = signerAuthToken
        self.sessionCallbacks = sessionCallbacks
        self.closeInFinish = closeInFinish
        self.dimensions = dimensions
        self.displayOptions = displayOptions
    }
}
