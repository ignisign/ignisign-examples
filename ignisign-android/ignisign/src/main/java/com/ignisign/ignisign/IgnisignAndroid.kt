package com.ignisign.ignisign

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import android.content.Context
import android.util.AttributeSet
import android.util.Log
import android.webkit.*
import com.google.gson.JsonObject
import com.ignisign.ignisign.public.IgnisignDocumentPrivateFileDto
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

data class IgnisignSignatureSessionDimensions (
    var width: String,
    var height: String
)

enum class IgnisignJsEvents {
    IGNISIGN_LOADED,
    IFRAME_TOO_SMALL
}

data class IgnisignJSSignatureSessionsDisplayOptions (
    var showTitle: Boolean,
    var showDescription: Boolean,
    var darkMode: Boolean = false,
    var forceLanguage: IgnisignSignatureLanguages,
    var forceShowDocumentInformations: Boolean = false
) {
    fun convertToQueryString(): String {
        val propertiesMap = mapOf(
            "showTitle" to showTitle,
            "showDescription" to showDescription,
            "darkMode" to darkMode,
            "forceLanguage" to forceLanguage?.name,
            "forceShowDocumentInformations" to forceShowDocumentInformations
        )

        return propertiesMap.entries
            .filter { it.value != null }
            .joinToString("&") { "${it.key}=${it.value}" }
    }
}

data class IgnisignInitParams (
    var idFrame: String,
    var signatureRequestId: String,
    var signerId: String,
    var signatureSessionToken: String,
    var signerAuthSecret: String,
    var sessionCallbacks: ISessionCallbacks,
    var closeOnFinish: Boolean,
    var dimensions: IgnisignSignatureSessionDimensions,
    var displayOptions: IgnisignJSSignatureSessionsDisplayOptions
)

class IgnisignAndroid: WebView, IJSEventListener {
    private val TAG: String = "IgnisignAndroid"
    private val IGNISIGN_CLIENT_SIGN_URL = "https://sign.ignisign.io"

    lateinit var appId: String
    lateinit var env: IgnisignApplicationEnv

    lateinit var idFrame: String
    lateinit var ignisignClientSignUrl: String
    lateinit var signatureRequestId: String
    lateinit var signerId: String
    lateinit var signatureSessionToken: String
    lateinit var signerAuthToken: String
    lateinit var sessionCallbacks: ISessionCallbacks
    var closeOnFinish: Boolean = true
    lateinit var dimensions: IgnisignSignatureSessionDimensions
    lateinit var displayOptions: IgnisignJSSignatureSessionsDisplayOptions

    private val IFRAME_MIN_WIDTH  = 200;
    private val IFRAME_MIN_HEIGHT = 400;

    private val debug = true

    constructor(context: Context) : super(context) {}
    constructor(context: Context, attrs: AttributeSet) : super(context, attrs) {}
    constructor(context: Context, attrs: AttributeSet, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {}

    fun debugPrint(message: String) {
        if (debug) {
            Log.d(TAG, message)
        }
    }

    fun setValues(appId: String, env: IgnisignApplicationEnv, ignisignClientSignUrl: String? = null) {
        this.appId = appId
        this.env = env
        if (ignisignClientSignUrl != null) {
            this.ignisignClientSignUrl = ignisignClientSignUrl
        } else {
            this.ignisignClientSignUrl = Config.defaultIgnisignClientSignUrl
        }
    }

    fun initSignatureSession(initParams: IgnisignInitParams) {
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true

        debugPrint("trace initSignatureSession : params: " + initParams.toString())

        this.idFrame = initParams.idFrame
        this.signerId = initParams.signerId
        this.signatureRequestId = initParams.signatureRequestId
        this.closeOnFinish = initParams.closeOnFinish
        this.displayOptions = initParams.displayOptions

        this.signerAuthToken = initParams.signerAuthSecret
        this.signatureSessionToken = initParams.signatureSessionToken
        this.sessionCallbacks = initParams.sessionCallbacks
        this.dimensions = initParams.dimensions

        this.ignisignClientSignUrl = IGNISIGN_CLIENT_SIGN_URL

        val signatureSessionLink = getUrlSessionLink(signatureRequestId, signerId, signatureSessionToken, signerAuthToken, displayOptions)

        debugPrint("trace session link : " + signatureSessionLink)

        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                return super.shouldOverrideUrlLoading(view, request)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                loadUrl("javascript:(function() {" +
                        "function receiveMessage(event) {\n" +
                        "AndroidInterface.onMessageReceived(JSON.stringify(event.data));\n" +
                        "}" +
                        "window.addEventListener(\"message\", receiveMessage, false);"+
                        "})()")
            }
        }

        debugPrint("trace webview - display iFrame with id : " + idFrame)

        val jsInterface = JavaScriptInterface()
        jsInterface.listener = this
        addJavascriptInterface(jsInterface, "AndroidInterface")
        loadUrl(signatureSessionLink)
    }

    public fun cancelSignatureSession() {
        closeIFrame()
    }

    /*** private ***/

    private fun closeIFrame() {
        CoroutineScope(Dispatchers.Main).launch {
            loadUrl("")
            destroy()
        }
    }

    private class JavaScriptInterface {
        private val TAG: String? = "JSInterface"
        lateinit var listener: IJSEventListener
        @JavascriptInterface
        fun onMessageReceived(message: String) {
            if (listener != null) {
                listener.handleEvent(message)
            }
        }
    }

    override fun handleEvent(message: String) {
        val args = jsonToMap(message)
        debugPrint("trace webview : map args : " + args)
        if (args.containsKey("type") && args.containsKey("data")) {
            val type = args["type"]
            val data = args["data"] as Map<String, Any>
            if (type == IgnisignBroadcastableActions.NEED_PRIVATE_FILE_URL.name) {
                debugPrint("trace webview - case private file url")
                val documentId = data["documentId"] as? String
                val externalDocumentId = data["externalDocumentId"] as? String
                val privateFileRequestDto = documentId?.let {
                    IgnisignBroadcastableActionPrivateFileRequestDto.PrivateFileRequestData(
                        documentId = it,
                        externalDocumentId = externalDocumentId
                    )
                }?.let {
                    IgnisignBroadcastableActionPrivateFileRequestDto(
                        type = IgnisignBroadcastableActions.NEED_PRIVATE_FILE_URL,
                        data = it
                    )
                }

                if (privateFileRequestDto != null) {
                    managePrivateFileInfoProvisioning(privateFileRequestDto)
                }
            }  else if (type == IgnisignBroadcastableActions.OPEN_URL.name) {
                debugPrint( "trace webview - case open url")
                val url = data["url"] as? String
                if (url != null) {
                    loadUrl(url)
                }
            } else if(type == IgnisignBroadcastableActions.SIGNATURE_FINALIZED.name) {
                debugPrint("trace webview - case finalized")
                val signatureIds = data["signatureIds"]?.let { convertAnyToStringList(it) }
                val signatureRequestDto = signatureIds?.let {
                    IgnisignBroadcastableActionSignatureFinalizedDto.SignatureFinalizedData(
                        signatureIds = it
                    )
                }?.let {
                    IgnisignBroadcastableActionSignatureFinalizedDto(
                        type = IgnisignBroadcastableActions.SIGNATURE_FINALIZED,
                        data = it
                    )
                }

                if (signatureRequestDto != null) {
                    finalizeSignatureRequest(signatureRequestDto)
                }
            } else if (type == IgnisignBroadcastableActions.SIGNATURE_ERROR.name) {
                debugPrint("trace webview - case error")
                var errorCode = ""
                (data["errorCode"] as? String).let {
                    if (it != null) {
                        errorCode = it
                    }
                }
                val errorContext = data["errorContext"] as? Any

                debugPrint("trace errorCode : " + errorCode)
                debugPrint("trace errorContext : " + errorCode)

                val signatureErrorDto = IgnisignBroadcastableActionSignatureErrorDto(
                    type = IgnisignBroadcastableActions.SIGNATURE_ERROR,
                    data = IgnisignBroadcastableActionSignatureErrorDto.SignatureErrorData(
                        errorCode = errorCode,
                        errorContext = errorContext
                    )
                )
                manageSignatureRequestError(signatureErrorDto)

            }
        } else if (args.containsKey("type") && (!args.containsKey("data") || (args.containsKey("data") && (args["data"] as? Map<String, Any>)?.entries?.isEmpty() == true))) {
            sessionCallbacks.handleSignatureSessionError(
                "IGNISIGN_JS_HANDLE_EVENT_ERROR",
                args,
                signerId,
                signatureRequestId
            )
        }
    }

    private fun managePrivateFileInfoProvisioning(action: IgnisignBroadcastableActionPrivateFileRequestDto) { //Ignisign Broadcastble Action
        val documentId = action.data.documentId
        val externalDocumentId = action.data.externalDocumentId

        if (documentId != null && externalDocumentId != null) {
            sessionCallbacks.handlePrivateFileInfoProvisioning(
                documentId,
                externalDocumentId,
                signerId,
                signatureRequestId
            )
        }

        if (closeOnFinish) {
            closeIFrame()
        }
    }

    private fun finalizeSignatureRequest(action: IgnisignBroadcastableActionSignatureFinalizedDto) {
        val signatureIds = action.data.signatureIds
        if (signatureIds != null) {
            sessionCallbacks.handleSignatureSessionFinalized(
                signatureIds,
                signerId,
                signatureRequestId
            )
        }

        if (closeOnFinish) {
            closeIFrame()
        }
    }

    private fun manageSignatureRequestError(action: IgnisignBroadcastableActionSignatureErrorDto) {
        var errorCode = action.data.errorCode
        var errorContext = action.data.errorContext

        if (errorCode != null /*&& errorContext != null*/) {
            sessionCallbacks.handleSignatureSessionError(
                errorCode,
                errorContext,
                signerId,
                signatureRequestId
            )
        }

        if (closeOnFinish) {
            closeIFrame()
        }
    }

    private fun convertAnyToStringList(value: Any): List<String>? {
        return when (value) {
            is Array<*> -> value.filterIsInstance<String>()
            is List<*> -> value.filterIsInstance<String>()
            is String -> listOf(value)
            else -> null
        }
    }

    private fun getUrlSessionLink(signatureRequestId: String, signerId: String, signatureSessionToken: String, signerAuthSecret: String, displayOptions: IgnisignJSSignatureSessionsDisplayOptions): String {
        return "${this.ignisignClientSignUrl}/signature-requests/${signatureRequestId}/signers/${signerId}/sign?token=${signatureSessionToken}&signerSecret=${signerAuthSecret}&${displayOptions.convertToQueryString()}"
    }

    private fun jsonToMap(json: String): Map<String, Any> {
        val gson = Gson()
        val type = object : TypeToken<Map<String, Any>>() {}.type
        return gson.fromJson(json, type)
    }
}