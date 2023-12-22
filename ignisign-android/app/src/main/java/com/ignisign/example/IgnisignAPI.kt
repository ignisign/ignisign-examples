package com.ignisign.example

import android.util.Log
import retrofit2.Call
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

interface IgnisignAPI {
    @GET("v1/contract-to-sign-contexts")
    fun getContracts(): Call<List<ContractContext>>
}

class IgnisignAPIService(baseUrl: String) {
    private val TAG: String = "IgnisignApiService"
    private val api: IgnisignAPI

    init {
        val retrofit = Retrofit.Builder()
            .baseUrl(baseUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(IgnisignAPI::class.java)
    }

    fun getContracts(onResult: (List<ContractContext>?) -> Unit) {
        api.getContracts().enqueue(object : retrofit2.Callback<List<ContractContext>> {
            override fun onResponse(call: retrofit2.Call<List<ContractContext>>, response: retrofit2.Response<List<ContractContext>>) {

                if (response.isSuccessful) {
                    onResult(response.body())
                } else {

                    onResult(null)
                }
            }

            override fun onFailure(call: retrofit2.Call<List<ContractContext>>, t: Throwable) {
                Log.d(TAG, "trace api fetch contracts : " + call.request().url)
                Log.d(TAG, "trace api fetch contracts : " + t.message)

                onResult(null)
            }
        })
    }
}
