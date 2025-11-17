package com.example.synapse

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.synapse.ui.theme.SynapseTheme
import com.example.synapse.presentation.contacts.CreateContact
import com.example.synapse.presentation.contacts.ContactsScreen
import com.example.synapse.presentation.contacts.ContactDetailScreen
import com.example.synapse.presentation.auth.SignInScreen
import com.example.synapse.presentation.auth.SignUpScreen
import com.example.synapse.presentation.onboarding.OnboardingScreen
import com.example.synapse.presentation.tickets.TicketsScreen
import com.example.synapse.presentation.tickets.CreateTicketScreen
import com.example.synapse.presentation.LandingPage
import com.example.synapse.presentation.dashboard.OwnerDashboard
import com.example.synapse.presentation.pipelines.PipelinesScreen
import com.example.synapse.presentation.leads.LeadsScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            SynapseTheme {
                SynapseApp()
            }
        }
    }
}

@Composable
fun SynapseApp() {
    val navController = rememberNavController()

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
                onSignInSuccess = { needsOnboarding ->
                    if (needsOnboarding) {
                        navController.navigate("onboard") {
                            popUpTo("landing") { inclusive = true }
                        }
                    } else {
                        navController.navigate("owner_dashboard") {
                            popUpTo("landing") { inclusive = true }
                        }
                    }
                }
            )
        }
        
        composable("signup") {
            SignUpScreen(
                onNavigateToSignIn = { navController.navigate("signin") },
                onSignUpSuccess = { navController.navigate("onboard") {
                    popUpTo("landing") { inclusive = true }
                }}
            )
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
        
        // Deals screens - placeholder until DealsScreen is created
        composable("deals") {
            OwnerDashboard(
                isDarkMode = false,
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
        
        composable("leads") {
            LeadsScreen(
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
        
        composable("settings") {
            OwnerDashboard(
                isDarkMode = false,
                navController = navController,
                onBack = { navController.popBackStack() }
            )
        }
    }
}


