package com.ignisign.example

import android.annotation.SuppressLint
import android.content.ContentValues.TAG
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Spinner
import androidx.fragment.app.Fragment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.internal.notify
import java.io.IOException
import java.net.URL

class ListContractFragment : Fragment() {

    lateinit var spinner: Spinner
    var spinnerSource: MutableList<User> = mutableListOf()
    var spinnerDisplayData: MutableList<String> = mutableListOf()
    private lateinit var adapter: ArrayAdapter<String>

    @SuppressLint("MissingInflatedId")
    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_first, container, false)

        spinner = view.findViewById(R.id.spinner_users)
        adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_item, spinnerDisplayData)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinner.adapter = adapter

        CoroutineScope(Dispatchers.IO).launch {
            getCustomers()
            getSellers()
        }

        spinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
                Log.d(TAG, "onItemSelected : " + position + " --> " + spinnerSource.get(position))
            }

            override fun onNothingSelected(parent: AdapterView<*>) {

            }
        }

        return view
    }

    fun updateDataAndRefreshAdapter(users: List<User>) {
        CoroutineScope(Dispatchers.Main).launch {
            spinnerSource.addAll(users)
            spinnerDisplayData.addAll(users.map { it.displayName })
            adapter.notifyDataSetChanged()
        }
    }

    fun getCustomers() {
        val url = "https://${Config.local_ip}/v1/customers"
        val client = OkHttpClient()
        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Unexpected code $response")
            }

            val responseBody = response.body?.string()
            val users = responseBody?.let { User.parseJson(it) }

            if (users != null) {
                updateDataAndRefreshAdapter(users)
            }
        }
    }

    fun getSellers() {
        val url = "https://${Config.local_ip}/v1/sellers"
        val client = OkHttpClient()
        val request = Request.Builder()
            .url(url)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Unexpected code $response")
            }

            val responseBody = response.body?.string()
            val users = responseBody?.let { User.parseJson(it) }

            if (users != null) {
                updateDataAndRefreshAdapter(users)
            }
        }
    }

    fun getContractsForUser(id: String) {

    }
}
