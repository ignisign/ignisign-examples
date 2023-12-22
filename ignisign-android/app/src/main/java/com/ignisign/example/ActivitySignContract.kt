package com.ignisign.example

import android.content.Context
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.ignisign.ignisign.*

class ActivitySignContract: AppCompatActivity(), ISessionCallbacks {
    private val TAG: String?  = "SignContractFragment"
    lateinit var ignisignAndroid: IgnisignAndroid

    var signatureRequestId = ""
    var signatureSessionToken = ""
    var signerId = ""
    var authSecret =  ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_sign_contract)

        ignisignAndroid = findViewById(R.id.embedded_signature)

        val extras = intent.extras

        extras?.getString("signatureRequestId")?.let {
            signatureRequestId = it
        }
        extras?.getString("signatureSessionToken")?.let {
            signatureSessionToken = it
        }
        extras?.getString("signerId")?.let {
            signerId = it
        }
        extras?.getString("authSecret")?.let {
            authSecret = it
        }

        Log.d(TAG, "trace signatureRequestId : " + signatureRequestId)
        Log.d(TAG, "trace signatureSessionToken : " + signatureSessionToken)
        Log.d(TAG, "trace signerId : " + signerId)
        Log.d(TAG, "trace authSecret : " + authSecret)

        val dimensions = IgnisignSignatureSessionDimensions(
            width = "${getScreenWidthDp(this)-20}",
            height = "${getScreenHeightDp(this)-80}"
        )

        val displayOptions = IgnisignJSSignatureSessionsDisplayOptions(
            showTitle = true,
            showDescription = true,
            darkMode = false,
            forceLanguage = IgnisignSignatureLanguages.FR,
            forceShowDocumentInformations = false
        )

        val params = IgnisignInitParams(
            idFrame = "test-ignisign-sdk",
            signatureRequestId = signatureRequestId,
            signerId = signerId,
            signatureSessionToken = signatureSessionToken,
            signerAuthSecret = authSecret,
            sessionCallbacks = this,
            dimensions = dimensions,
            displayOptions =displayOptions,
            closeOnFinish = true
        )

        ignisignAndroid.setValues("com.ignisign.example", IgnisignApplicationEnv.DEVELOPMENT)
        ignisignAndroid.initSignatureSession(params)
    }

    override fun handlePrivateFileInfoProvisioning(
        documentId: String,
        externalDocumentId: String,
        signerId: String,
        signatureRequestId: String
    ) {
        Log.d(TAG, "trace handlePrivateFileInfiProvisioning : documentId = " + documentId + " externalDocumentId : " + externalDocumentId + " signerId : " + signerId + " signatureRequestId : " + signatureRequestId)
        showAlert(this@ActivitySignContract, "handlePrivateFileInfoProvisioning", "documentId: ${documentId} - externalDocumentId: ${externalDocumentId} - signerId: ${signerId} - signatureRequestId : ${signatureRequestId}")
    }

    override fun handleSignatureSessionError(
        errorCode: String,
        errorContext: Any?,
        signerId: String,
        signatureRequestId: String
    ) {
        Log.d(TAG, "trace handleSignatureSessionError : errorCode : " + errorCode + " errorContext : " + errorContext + " signerId : " + signerId + " signatureRequestId : " + signatureRequestId)
        showAlert(this@ActivitySignContract, "handleSignatureSessionError", "errorCode: ${errorCode} - errorContext: ${errorContext} - signerId: ${signerId} - signatureRequestId : ${signatureRequestId}")
    }

    override fun handleSignatureSessionFinalized(
        signatureIds: List<String>,
        signerId: String,
        signatureRequestId: String
    ) {
        Log.d(TAG, "trace handleSignatureSessionFinalized : signatureIds : " + signatureIds + " signerId : " + signerId + " signatureRequestId : " + signatureRequestId)
        showAlert(this@ActivitySignContract, "handleSignatureSessionFinalized", "signatureIds: ${signatureIds} - signerId: ${signerId} - signatureRequestId : ${signatureRequestId}")
    }

    fun getScreenWidthDp(context: Context): Int {
        val displayMetrics = DisplayMetrics()
        (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.getMetrics(displayMetrics)
        return (displayMetrics.widthPixels / displayMetrics.density).toInt()
    }

    fun getScreenHeightDp(context: Context): Int {
        val displayMetrics = DisplayMetrics()
        (context.getSystemService(Context.WINDOW_SERVICE) as WindowManager).defaultDisplay.getMetrics(displayMetrics)
        return (displayMetrics.heightPixels / displayMetrics.density).toInt()
    }

    fun showAlert(context: Context, title: String, message: String) {
        runOnUiThread {
            val builder = AlertDialog.Builder(context)
            builder.setTitle(title)
            builder.setMessage(message)
            builder.setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
            val dialog: AlertDialog = builder.create()
            dialog.show()
        }
    }
}