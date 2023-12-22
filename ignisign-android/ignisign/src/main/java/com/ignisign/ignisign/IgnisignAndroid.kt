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
    var closeOnFinish: Boolean = false
    lateinit var dimensions: IgnisignSignatureSessionDimensions
    lateinit var displayOptions: IgnisignJSSignatureSessionsDisplayOptions

    private val IFRAME_MIN_WIDTH  = 200;
    private val IFRAME_MIN_HEIGHT = 400;

    constructor(context: Context) : super(context) {}
    constructor(context: Context, attrs: AttributeSet) : super(context, attrs) {}
    constructor(context: Context, attrs: AttributeSet, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {}

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

        Log.d(TAG, "trace initSignatureSession : params: " + initParams.toString())

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

                /*val jsCode = """
                    function getDocumentSize() {
                        var width = document.documentElement.scrollWidth;
                        var height = document.documentElement.scrollHeight;
                        AndroidInterface.onDocumentSizeReceived(width, height);
                    }
                    getDocumentSize(); 
                """

                loadUrl("javascript:$jsCode")*/


                //checkIfFrameIsTooSmall()
            }
        }

        Log.d(TAG, "trace webview - display iFrame with id : " + idFrame)

        val jsInterface = JavaScriptInterface()
        jsInterface.listener = this
        addJavascriptInterface(jsInterface, "AndroidInterface")
        loadUrl(signatureSessionLink)

        //todo gestion taille
    }

    public fun cancelSignatureSession() {
        closeIFrame()
    }

    /*** private ***/

    private fun closeIFrame() {
        /*CoroutineScope(Dispatchers.Main).launch {
            loadUrl("")
            destroy()
        }*/
    }

    private class JavaScriptInterface {
        private val TAG: String? = "JSInterface"
        lateinit var listener: IJSEventListener
        /*fun onDocumentSizeReceived(width: Int, height: Int) {
            Log.d("WebView", "Taille du document: Largeur=$width, Hauteur=$height")
        }*/
        @JavascriptInterface
        fun onMessageReceived(message: String) {
            if (listener != null) {
                listener.handleEvent(message)
            }
        }

        /*@JavascriptInterface
        fun onIframeTooSmall(width: Int, height: Int) {
            Log.d(TAG, "L'iframe est trop petit: Largeur=$width, Hauteur=$height")
        }*/
    }

    override fun handleEvent(message: String) {
        val args = jsonToMap(message)
        Log.d(TAG, "trace webview : map args : " + args)

        if (args.containsKey("type") && args.containsKey("data")) {
            val type = args["type"]
            val data = args["data"] as Map<String, Any>
            if (type == IgnisignBroadcastableActions.NEED_PRIVATE_FILE_URL.name) {
                Log.d(TAG, "trace webview - case private file url") //todo
                managePrivateFileInfoProvisioning(data)
            }  else if (type == IgnisignBroadcastableActions.OPEN_URL.name) {
                Log.d(TAG, "trace webview - case open url")
                val url = data["url"] as? String
                if (url != null) {
                    loadUrl(url)
                }
            } else if(type == IgnisignBroadcastableActions.SIGNATURE_FINALIZED.name) {
                Log.d(TAG, "trace webview - case finalized")
                finalizeSignatureRequest(data)
            } else if (type == IgnisignBroadcastableActions.SIGNATURE_ERROR.name) {
                Log.d(TAG, "trace webview - case error")
                manageSignatureRequestError(data)
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

    private fun managePrivateFileInfoProvisioning(data: Map<String, Any>) { //Ignisign Broadcastble Action
        val documentId = data["documentId"] as? String
        val externalDocumentId = data["externalDocumentId"] as? String

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

    private fun finalizeSignatureRequest(data: Map<String, Any>) {
        val signatureIds = data["signatureIds"]?.let { convertAnyToStringList(it) }
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

    private fun manageSignatureRequestError(data: Map<String, Any>) {
        val errorCode = data["errorCode"] as? String
        val errorContext = data["errorContext"] as? Any

        if (errorCode != null && errorContext != null) {
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

    private fun checkIfFrameIsTooSmall() { //todo
        /*val jsCode = """
            function checkIfIframeIsTooSmall() { 
                if (document.offsetHeight < $IFRAME_MIN_HEIGHT || document.offsetWidth < $IFRAME_MIN_WIDTH) {
                    AndroidInterface.onIframeTooSmall(docElement.offsetWidth, docElement.offsetHeight);
                } else {
                    AndroidInterface.onIframeTooSmall(docElement.offsetWidth, docElement.offsetHeight);
                }
            }
            checkIfIframeIsTooSmall(); 
        """
        loadUrl("javascript:$jsCode")*/

        val jsCode = """
            function checkIfIframeIsTooSmall() { 
                AndroidInterface.onIframeTooSmall(docElement.offsetWidth, docElement.offsetHeight);
            }
            checkIfIframeIsTooSmall(); 
        """
        loadUrl("javascript:$jsCode")
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