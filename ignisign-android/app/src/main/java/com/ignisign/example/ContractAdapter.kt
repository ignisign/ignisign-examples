package com.ignisign.example

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

interface IContractAdapter {
    fun onSignatureTapped(position: Int)
}

class ContractsAdapter(private val contracts: MutableList<ContractContext>, private val listener: IContractAdapter) : RecyclerView.Adapter<ContractsAdapter.ContractViewHolder>() {

    class ContractViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val textViewContract: TextView = view.findViewById(R.id.textViewContract)
        val buttonSignContract: Button = view.findViewById(R.id.buttonSignContract)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ContractViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_contract, parent, false)
        return ContractViewHolder(view)
    }

    override fun onBindViewHolder(holder: ContractViewHolder, position: Int) {
        holder.textViewContract.text = contracts[position].signatureRequestId
        holder.buttonSignContract.setOnClickListener {
            listener.onSignatureTapped(position)
        }
    }

    override fun getItemCount() = contracts.size
}
