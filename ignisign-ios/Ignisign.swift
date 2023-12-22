//
//  Ignisign.swift
//  ignisign-ios
//
//  Created by Marc Nigdélian on 22/12/2023.
//

import Foundation
import WebKit

public class Ignisign: WKWebView, WKScriptMessageHandler, WKNavigationDelegate {
    var ignisignClientSignUrlDefault = "https://sign.ignisign.io"
    let IFRAME_MIN_HEIGHT: Int = 400
    let IFRAME_MIN_WIDTH: Int = 300
    var appId: String?
    var env: IgnisignApplicationEnv?
    var ignisignClientSignUrl: String?
    var debug = true
    
    var signerId: String?
    var signatureRequestId: String?
    var closeOnFinish: Bool = true
    var signerAuthToken: String?
    var sessionCallbacks: IgnisignJS_SignatureSession_Callbacks?
    var displayOptions: IgnisignJSSignatureSessionsDisplayOptions?
    var signatureSessionToken: String?
    var signatureAuthToken: String?
    var dimensions: IgnisignSignatureSessionDimensions?
    
    private func debugPrint(_ message: String) {
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
        debugPrint("trace ignisign ios - init Signature session called : \(initParams)")
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
            debugPrint("trace ignisign ios - init Signature session called load webview : \(signatureSessionLink)")
            load(URLRequest(url: URL(string: signatureSessionLink)!))
        } else {
            debugPrint("trace ignisign ios - values nil")
        }
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let jsCode = """
        (function() {
            function receiveMessage(event) {
                window.webkit.messageHandlers.message.postMessage(JSON.stringify(event.data));
            }
            window.addEventListener("message", receiveMessage, false);
        })()
        """
         debugPrint("trace webview didFinish")
        webView.evaluateJavaScript(jsCode, completionHandler: nil)
    }

   public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
       if message.name == "message", let messageBody = message.body as? String {
           debugPrint("message : \(messageBody)")
           handleEvent(message: messageBody)
       }
   }
    
    private func handleEvent(message: String) {
        debugPrint("Message received from JS: \(message)")
        if let args = jsonToMap(json: message) {
            if let type = args["type"] as? String {
                if let data = args["data"] as? [String: Any] {
                    if type == IgnisignBroadcastableActions.needPrivateFileUrl.rawValue {
                        debugPrint("trace callback - need private file url")
                        
                        if let documentId = data["documentId"] as? String, let externalDocumentId = data["externalDocumentId"] as? String {
                            let data = IgnisignBroadcastableActionPrivateFileRequestDto.PrivateFileRequestData(
                                documentId: documentId,
                                externalDocumentId: externalDocumentId
                            )
                            
                            let actionPrivateFileDto = IgnisignBroadcastableActionPrivateFileRequestDto(
                                type: IgnisignBroadcastableActions.needPrivateFileUrl,
                                data: data
                            )
                            
                            managePrivateFileInfoProvisioning(action: actionPrivateFileDto)
                        }
                    } else if type == IgnisignBroadcastableActions.openUrl.rawValue {
                        if let url = data["url"] as? String {
                            load(URLRequest(url: URL(string:url)!))
                        }
                    } else if type == IgnisignBroadcastableActions.signatureFinalized.rawValue {
                        debugPrint("trace callback - signature finalized")
                        if let signatureIds = data["signatureIds"] as? [String] {
                            let data = IgnisignBroadcastableActionSignatureFinalizedDto.SignatureFinalizedData(signatureIds: signatureIds)
                            let actionSignatureFinalizedDto = IgnisignBroadcastableActionSignatureFinalizedDto(type: IgnisignBroadcastableActions.signatureFinalized, data: data)
                            finalizeSignatureRequest(action: actionSignatureFinalizedDto)
                        }
                        
                    } else if type == IgnisignBroadcastableActions.signatureError.rawValue {
                        debugPrint("trace callback - signature error")
                        if let errorCode = data["errorCode"] as? String, let errorContext = data["errorContext"] {
                            let data = IgnisignBroadcastableActionSignatureErrorDto.SignatureErrorData(errorCode: errorCode, errorContext: errorContext)
                            let signatureErrorActionDto = IgnisignBroadcastableActionSignatureErrorDto(type: IgnisignBroadcastableActions.signatureError, data: data)
                            manageSignatureRequestError(action: signatureErrorActionDto)
                        }
                    }
                }
            } else if (args["type"] != nil && (args["data"] == nil || ((args["data"] as? [String: Any]) == nil))) {
               
           }
        }
    }
    
    private func managePrivateFileInfoProvisioning(action: IgnisignBroadcastableActionPrivateFileRequestDto) {
        
        let documentId = action.data.documentId
        let externalDocumentId = action.data.externalDocumentId
        
        if let signerId = signerId, let signatureRequestId = signatureRequestId {
            sessionCallbacks?.handlePrivateFileInfoProvisioning(documentId: documentId, externalDocumentId: externalDocumentId, signerId: signerId, signatureRequestId: signatureRequestId)
        }

        if closeOnFinish {
            closeIFrame()
        }
    }

    private func finalizeSignatureRequest(action: IgnisignBroadcastableActionSignatureFinalizedDto) {
        if let signerId = signerId, let signatureRequestId = signatureRequestId {
            sessionCallbacks?.handleSignatureSessionFinalized(signatureIds: action.data.signatureIds, signerId: signerId, signatureRequestId: signatureRequestId)
        }

        if closeOnFinish {
            closeIFrame()
        }
    }

    private func manageSignatureRequestError(action: IgnisignBroadcastableActionSignatureErrorDto) {
        let errorCode = action.data.errorCode
        let errorContext = action.data.errorContext
        
        debugPrint("errorCode : \(errorCode)")
        debugPrint("errorContext : \(errorContext)")
        debugPrint("signerId : \(signerId)")
        debugPrint("signatureRequestId : \(signatureRequestId)")

        if let signerId = signerId, let signatureRequestId = signatureRequestId {
            sessionCallbacks?.handleSignatureSessionError(errorCode: errorCode, errorContext: errorContext, signerId: signerId, signatureRequestId: signatureRequestId)
        }

        if closeOnFinish {
            closeIFrame()
        }
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
                debugPrint("Erreur lors de la conversion du JSON en map: \(error)")
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
