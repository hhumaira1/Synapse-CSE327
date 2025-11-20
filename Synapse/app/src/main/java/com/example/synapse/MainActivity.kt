package com.example.synapse

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import android.content.Intent
import android.net.Uri
import com.example.synapse.ui.theme.SynapseTheme
import com.example.synapse.presentation.contacts.CreateContact
import com.example.synapse.presentation.contacts.ContactsScreen
import com.example.synapse.presentation.contacts.ContactDetailScreen
import com.example.synapse.presentation.auth.SignInScreen
import com.example.synapse.presentation.auth.SignUpScreen
import com.example.synapse.presentation.auth.WorkspaceSelectorScreen
import com.example.synapse.presentation.onboarding.OnboardingScreen
import com.example.synapse.presentation.tickets.TicketsScreen
import com.example.synapse.presentation.tickets.CreateTicketScreen
import com.example.synapse.presentation.LandingPage
import com.example.synapse.presentation.dashboard.OwnerDashboard
import com.example.synapse.presentation.deals.DealsScreen
import com.example.synapse.presentation.pipelines.PipelinesScreen
import com.example.synapse.presentation.pipelines.PipelineDetailScreen
import com.example.synapse.presentation.leads.LeadsScreen
import com.example.synapse.presentation.leads.LeadDetailScreen
import com.example.synapse.presentation.portal.PortalDashboardScreen
import com.example.synapse.presentation.portal.PortalTicketsScreen
import com.example.synapse.presentation.portal.PortalAcceptScreen
import com.example.synapse.presentation.settings.SettingsScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private var pendingPortalToken by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Handle deep link if activity was started with one
        handleIntent(intent)

        setContent {
            SynapseTheme {
                SynapseApp(pendingPortalToken)
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        val data: Uri? = intent.data
        if (data != null && data.scheme == "https" && data.host == "synapse-portal") {
            val path = data.path
            if (path?.startsWith("/accept") == true) {
                // Extract token from query parameters
                val token = data.getQueryParameter("token")
                if (!token.isNullOrEmpty()) {
                    pendingPortalToken = token
                }
            }
        }
    }
}

@Composable
fun SynapseApp(pendingPortalToken: String? = null) {
    val navController = rememberNavController()

    // Handle pending portal token navigation
    LaunchedEffect(pendingPortalToken) {
        pendingPortalToken?.let { token ->
            // Navigate to portal accept screen with the token
            navController.navigate("portal_accept/$token") {
                // Clear the back stack to make this the root
                popUpTo("landing") { inclusive = true }
            }
        }
    }

    Scaffold(modifier = Modifier.fillMaxSize()) { paddingValues ->
        NavGraph(
            navController = navController,
            modifier = Modifier.padding(paddingValues)
        )
    }
}

@Composable
fun NavGraph(navController: NavHostController, modifier: Modifier = Modifier) {
    NavHost(
        navController = navController,
        startDestination = "landing",
        modifier = modifier
    ) {
        // Landing and Auth screens
        composable("landing") { LandingPage(navController) }
        
        composable("signin") {
            SignInScreen(
                onNavigateToSignUp = { navController.navigate("signup") },
                onNavigateToWorkspaceSelector = { navController.navigate("workspace_selector") {
                    popUpTo("landing") { inclusive = true }
                }}
            )
        }

        composable("signup") {
            SignUpScreen(
                onNavigateToSignIn = { navController.navigate("signin") },
                onNavigateToWorkspaceSelector = { navController.navigate("workspace_selector") {
                    popUpTo("landing") { inclusive = true }
                }}
            )
        }
        
        // Workspace selector
        composable("workspace_selector") {
            WorkspaceSelectorScreen(navController = navController)
        }

        // Onboarding screen
        composable("onboard") {
            OnboardingScreen(
                onOnboardingComplete = {
                    navController.navigate("owner_dashboard") {
                        popUpTo("onboard") { inclusive = true }
                    }
                }
            )
        }
        
        // Dashboard screens
        composable(
            route = "owner_dashboard",
        ) {
            OwnerDashboard(
                isDarkMode = false,
                navController = navController,
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        
        // Contacts screens
        composable("contacts") {
            ContactsScreen(
                onContactClick = { contactId ->
                    navController.navigate("contacts/$contactId")
                },
                onCreateContact = {
                    navController.navigate("contacts/create")
                }
            )
        }
        
        composable("contacts/{contactId}") { backStackEntry ->
            val contactId = backStackEntry.arguments?.getString("contactId") ?: return@composable
            ContactDetailScreen(
                contactId = contactId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        composable("contacts/create") { 
            CreateContact(
                navController,
                onSave = { navController.popBackStack() },
                onBack = { navController.popBackStack() }
            ) 
        }
        
        // Tickets screens
        composable("tickets") {
            TicketsScreen(
                onTicketClick = { ticketId ->
                    // TODO: Navigate to ticket details
                    // navController.navigate("tickets/$ticketId")
                },
                onCreateTicket = {
                    navController.navigate("tickets/create")
                }
            )
        }
        
        composable("tickets/create") {
            CreateTicketScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
        
        // Deals screen
        composable("deals") {
            DealsScreen(
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }
        
        // Pipelines and Leads screens
        composable("pipelines") {
            PipelinesScreen(
                navController = navController,
                isDarkMode = false,
                onBack = { navController.popBackStack() }
            )
        }
        
        composable("pipelines/{pipelineId}") { backStackEntry ->
            val pipelineId = backStackEntry.arguments?.getString("pipelineId") ?: return@composable
            PipelineDetailScreen(
                pipelineId = pipelineId,
                navController = navController,
                isDarkMode = false,
                onBack = { navController.popBackStack() }
            )
        }
        
        composable("leads") {
            LeadsScreen(
                navController = navController,
                isDarkMode = false,
                onBack = { navController.popBackStack() }
            )
        }
        
        composable("leads/{leadId}") { backStackEntry ->
            val leadId = backStackEntry.arguments?.getString("leadId") ?: return@composable
            LeadDetailScreen(
                leadId = leadId,
                navController = navController,
                isDarkMode = false,
                onBack = { navController.popBackStack() }
            )
        }
        
        composable("analytics") {
            OwnerDashboard(
                isDarkMode = false,
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }
        
        // Settings screen
        composable("settings") {
            com.example.synapse.presentation.settings.SettingsScreen(
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }

        // ========== Portal Screens ==========
        composable("portal_dashboard") {
            PortalDashboardScreen(
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }

        composable("portal_tickets") {
            PortalTicketsScreen(
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }

        composable("portal_accept/{token}") { backStackEntry ->
            val token = backStackEntry.arguments?.getString("token") ?: ""
            PortalAcceptScreen(
                token = token,
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }
    }
}


