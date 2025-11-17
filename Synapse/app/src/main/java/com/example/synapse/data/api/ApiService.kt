package com.example.synapse.data.api

import com.example.synapse.data.api.request.*
import com.example.synapse.data.api.response.*
import com.example.synapse.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    
    // ========== Authentication ==========
    @POST("auth/onboard")
    suspend fun onboardUser(@Body request: OnboardRequest): Response<OnboardResponse>
    
    @GET("auth/me")
    suspend fun getCurrentUser(): Response<User>
    
    // ========== Users & Workspaces ==========
    @GET("users/my-tenants")
    suspend fun getMyTenants(): Response<List<UserTenantInfo>>
    
    @POST("users/accept-invite/{token}")
    suspend fun acceptTeamInvite(@Path("token") token: String): Response<AcceptInviteResponse>
    
    // ========== Portal Customer ==========
    @GET("portal/customers/my-access")
    suspend fun getMyPortalAccess(): Response<List<PortalAccessResponse>>
    
    @GET("portal/customers/invitation/{accessToken}")
    suspend fun getPortalInvitation(@Path("accessToken") accessToken: String): Response<PortalInvitationDetails>
    
    @POST("portal/customers/link/{accessToken}")
    suspend fun linkPortalCustomer(@Path("accessToken") accessToken: String): Response<PortalLinkResponse>
    
    // ========== Contacts ==========
    @GET("contacts")
    suspend fun getContacts(
        @Query("search") search: String? = null,
        @Query("tags") tags: String? = null
    ): Response<List<Contact>>
    
    @GET("contacts/{id}")
    suspend fun getContactById(@Path("id") id: String): Response<Contact>
    
    @POST("contacts")
    suspend fun createContact(@Body request: CreateContactRequest): Response<Contact>
    
    @PATCH("contacts/{id}")
    suspend fun updateContact(
        @Path("id") id: String,
        @Body request: UpdateContactRequest
    ): Response<Contact>
    
    @DELETE("contacts/{id}")
    suspend fun deleteContact(@Path("id") id: String): Response<Unit>
    
    // ========== Leads ==========
    @GET("leads")
    suspend fun getLeads(
        @Query("status") status: String? = null,
        @Query("source") source: String? = null
    ): Response<List<Lead>>
    
    @GET("leads/{id}")
    suspend fun getLeadById(@Path("id") id: String): Response<Lead>
    
    @POST("leads")
    suspend fun createLead(@Body request: CreateLeadRequest): Response<Lead>
    
    @PATCH("leads/{id}")
    suspend fun updateLead(
        @Path("id") id: String,
        @Body request: UpdateLeadRequest
    ): Response<Lead>
    
    @DELETE("leads/{id}")
    suspend fun deleteLead(@Path("id") id: String): Response<Unit>
    
    @POST("leads/{id}/convert")
    suspend fun convertLead(@Path("id") id: String): Response<ConvertLeadResponse>
    
    // ========== Pipelines ==========
    @GET("pipelines")
    suspend fun getPipelines(): Response<List<Pipeline>>
    
    @GET("pipelines/{id}")
    suspend fun getPipelineById(@Path("id") id: String): Response<Pipeline>
    
    @POST("pipelines")
    suspend fun createPipeline(@Body request: CreatePipelineRequest): Response<Pipeline>
    
    @PATCH("pipelines/{id}")
    suspend fun updatePipeline(
        @Path("id") id: String,
        @Body request: UpdatePipelineRequest
    ): Response<Pipeline>
    
    @DELETE("pipelines/{id}")
    suspend fun deletePipeline(@Path("id") id: String): Response<Unit>
    
    // ========== Stages ==========
    @GET("stages")
    suspend fun getStages(
        @Query("pipelineId") pipelineId: String? = null
    ): Response<List<Stage>>
    
    @GET("stages/{id}")
    suspend fun getStageById(@Path("id") id: String): Response<Stage>
    
    @POST("stages")
    suspend fun createStage(@Body request: CreateStageRequest): Response<Stage>
    
    @PATCH("stages/{id}")
    suspend fun updateStage(
        @Path("id") id: String,
        @Body request: UpdateStageRequest
    ): Response<Stage>
    
    @DELETE("stages/{id}")
    suspend fun deleteStage(@Path("id") id: String): Response<Unit>
    
    // ========== Deals ==========
    @GET("deals")
    suspend fun getDeals(
        @Query("pipelineId") pipelineId: String? = null,
        @Query("stageId") stageId: String? = null
    ): Response<List<Deal>>
    
    @GET("deals/{id}")
    suspend fun getDealById(@Path("id") id: String): Response<Deal>
    
    @POST("deals")
    suspend fun createDeal(@Body request: CreateDealRequest): Response<Deal>
    
    @PATCH("deals/{id}")
    suspend fun updateDeal(
        @Path("id") id: String,
        @Body request: UpdateDealRequest
    ): Response<Deal>
    
    @DELETE("deals/{id}")
    suspend fun deleteDeal(@Path("id") id: String): Response<Unit>
    
    // ========== Tickets ==========
    @GET("tickets")
    suspend fun getTickets(
        @Query("status") status: String? = null,
        @Query("priority") priority: String? = null,
        @Query("contactId") contactId: String? = null
    ): Response<List<Ticket>>
    
    @GET("tickets/{id}")
    suspend fun getTicketById(@Path("id") id: String): Response<Ticket>
    
    @POST("tickets")
    suspend fun createTicket(@Body request: CreateTicketRequest): Response<Ticket>
    
    @PATCH("tickets/{id}")
    suspend fun updateTicket(
        @Path("id") id: String,
        @Body request: UpdateTicketRequest
    ): Response<Ticket>
    
    @DELETE("tickets/{id}")
    suspend fun deleteTicket(@Path("id") id: String): Response<Unit>
    
    @POST("tickets/{id}/comments")
    suspend fun addTicketComment(
        @Path("id") id: String,
        @Body request: AddCommentRequest
    ): Response<TicketComment>
    
    @GET("tickets/{id}/comments")
    suspend fun getTicketComments(@Path("id") id: String): Response<List<TicketComment>>
    
    // ========== Analytics ==========
    @GET("analytics/dashboard")
    suspend fun getDashboardStats(): Response<DashboardStats>
    
    @GET("analytics/leads-by-status")
    suspend fun getLeadsByStatus(): Response<Map<String, Int>>
    
    @GET("analytics/deals-by-stage")
    suspend fun getDealsByStage(@Query("pipelineId") pipelineId: String): Response<Map<String, Int>>
    
    @GET("analytics/tickets-by-status")
    suspend fun getTicketsByStatus(): Response<Map<String, Int>>
    
    @GET("analytics/revenue-forecast")
    suspend fun getRevenueForecast(): Response<RevenueForecast>
    
    // ========== Interactions ==========
    @GET("interactions")
    suspend fun getInteractions(
        @Query("contactId") contactId: String? = null,
        @Query("leadId") leadId: String? = null,
        @Query("dealId") dealId: String? = null
    ): Response<List<Interaction>>
    
    @POST("interactions")
    suspend fun createInteraction(@Body request: CreateInteractionRequest): Response<Interaction>
}
