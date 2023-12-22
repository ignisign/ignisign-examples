package com.ignisign.example

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class ActivityListContracts: AppCompatActivity(), IContractAdapter {
    private val TAG: String? = "ActivityListContracts"
    private lateinit var recyclerView: RecyclerView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var contractsAdapter: ContractsAdapter
    var contracts = mutableListOf<ContractContext>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_list_contracts)

        recyclerView = findViewById(R.id.recyclerView)
        contractsAdapter = ContractsAdapter(contracts, this)
        recyclerView.layoutManager = LinearLayoutManager(this)
        recyclerView.adapter = contractsAdapter

        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setOnRefreshListener {
            swipeRefreshLayout.isRefreshing = false
        }

        val ignisignAPI = IgnisignAPIService("http://192.168.3.62:4242")

        ignisignAPI.getContracts { objects ->
            if (objects != null) {
                this.contracts.clear()
                this.contracts.addAll(objects)
                this.contractsAdapter.notifyDataSetChanged()
                /*for (contract in objects) {
                    Log.d(TAG, "contracts : " + contract)
                }*/
            } else {
                Log.d(TAG, "trace Erreur lors de la récupération des contrats")
            }
        }
    }

    override fun onSignatureTapped(position: Int) {
        val intentSignature = Intent(this@ActivityListContracts, ActivitySignContract::class.java)

        Log.d(TAG, "trace onSignatureTapped : " + contracts[position].toString())

        intentSignature.putExtra("signatureRequestId", contracts[position].signatureRequestId)
        intentSignature.putExtra("signatureSessionToken", contracts[position].ignisignSignatureToken)
        intentSignature.putExtra("signerId", contracts[position].ignisignSignerId)
        intentSignature.putExtra("authSecret", contracts[position].ignisignUserAuthSecret)
        //intent.putExtra("env", contracts[position].ignisignAppEnv)
        startActivity(intentSignature)
    }
}