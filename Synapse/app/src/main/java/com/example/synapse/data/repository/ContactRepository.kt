package com.example.synapse.data.repository

import com.example.synapse.data.api.ApiService
import com.example.synapse.data.api.request.CreateContactRequest
import com.example.synapse.data.api.request.UpdateContactRequest
import com.example.synapse.data.model.Contact
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ContactRepository @Inject constructor(
    private val apiService: ApiService
) {
    
    suspend fun getContacts(search: String? = null, tags: String? = null): Result<List<Contact>> {
        return try {
            val response = apiService.getContacts(search, tags)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch contacts: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getContactById(id: String): Result<Contact> {
        return try {
            val response = apiService.getContactById(id)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch contact: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createContact(request: CreateContactRequest): Result<Contact> {
        return try {
            val response = apiService.createContact(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create contact: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateContact(id: String, request: UpdateContactRequest): Result<Contact> {
        return try {
            val response = apiService.updateContact(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update contact: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteContact(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteContact(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete contact: ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
