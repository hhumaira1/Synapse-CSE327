package com.example.synapse.data.api.portal

import com.example.synapse.data.api.response.PortalAccessResponse
import com.example.synapse.data.api.response.PortalInvitationDetails
import com.example.synapse.data.api.response.PortalLinkResponse
import com.example.synapse.data.model.portal.*
import retrofit2.Response
import retrofit2.http.*

interface PortalApiService {

    // ========== Portal Customer Access ==========
    @GET("portal/customers/my-access")
    suspend fun getMyPortalAccess(): Response<List<PortalAccessResponse>>

    @GET("portal/customers/invitation/{accessToken}")
    suspend fun getPortalInvitation(@Path("accessToken") accessToken: String): Response<PortalInvitationDetails>

    @POST("portal/customers/link/{accessToken}")
    suspend fun linkPortalCustomer(@Path("accessToken") accessToken: String): Response<PortalLinkResponse>

    // ========== Portal Tickets ==========
    @GET("portal/tickets")
    suspend fun getTickets(
        @Query("tenantId") tenantId: String? = null
    ): Response<List<PortalTicket>>

    @POST("portal/tickets")
    suspend fun createTicket(@Body request: CreateTicketRequest): Response<PortalTicket>

    @GET("portal/tickets/{id}")
    suspend fun getTicketDetail(
        @Path("id") id: String,
        @Query("tenantId") tenantId: String? = null
    ): Response<TicketDetail>

    @POST("portal/tickets/{id}/comments")
    suspend fun addComment(
        @Path("id") id: String,
        @Body request: AddCommentRequest
    ): Response<PortalComment>
}
