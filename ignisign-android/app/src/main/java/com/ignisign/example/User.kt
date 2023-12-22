package com.ignisign.example

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class User(
    val firstName: String,
    val lastName: String,
    val email: String,
    val type: String,
    val signatureProfileId: String,
    val signerId: String,
    val ignisignAuthSecret: String,
    val _id: Int
) {
    val displayName: String
        get() = "$firstName $lastName"

    companion object {
        fun parseJson(jsonString: String): List<User> {
            val gson = Gson()
            val listType = object : TypeToken<List<User>>() {}.type
            return gson.fromJson(jsonString, listType)
        }
    }
}