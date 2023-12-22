package com.ignisign.example

import android.content.Context
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import androidx.fragment.app.Fragment
import com.ignisign.ignisign.*

class SignContractFragment : Fragment(), ISessionCallbacks {
    private val TAG: String?  = "SignContractFragment"
    lateinit var ignisignAndroid: IgnisignAndroid

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_sign_a_contract, container, false)

        ignisignAndroid = view.findViewById(R.id.embedded_signature)

        val signatureRequestId = "65854b1d5c7395001c9a5a39"
        val signatureSessionToken = "pRC0l2S5SW2VsdWu1xAHr5SY4Q2FpEbYrMEQpbObWUU0jPFSEPxI0bsiCeZWpYv5"

        val signerId = "6582fc68ef3841001b92e413"
        val authSecret = "ffbdae8b-8ead-4fed-a601-d4ea62dcda50"

        val dimensions = IgnisignSignatureSessionDimensions(
            width = "${getScreenWidthDp(requireContext())-20}",
            height = "${getScreenHeightDp(requireContext())-80}"
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

        return view
    }

    override fun handlePrivateFileInfoProvisioning(
        documentId: String,
        externalDocumentId: String,
        signerId: String,
        signatureRequestId: String
    ) {
        Log.d(TAG, "trace handlePrivateFileInfiProvisioning : documentId = " + documentId + " externalDocumentId : " + externalDocumentId + " signerId : " + signerId + " signatureRequestId : " + signatureRequestId)
    }

    override fun handleSignatureSessionError(
        errorCode: String,
        errorContext: Any,
        signerId: String,
        signatureRequestId: String
    ) {
        Log.d(TAG, "trace handleSignatureSessionError : errorCode : " + errorCode + " errorContext : " + errorContext + " signerId : " + signerId + " signatureRequestId : " + signatureRequestId)
    }

    override fun handleSignatureSessionFinalized(
        signatureIds: List<String>,
        signerId: String,
        signatureRequestId: String
    ) {
        Log.d(TAG, "trace handleSignatureSessionFinalized : signatureIds : " + signatureIds + " signerId : " + signerId + " signatureRequestId : " + signatureRequestId)
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

}