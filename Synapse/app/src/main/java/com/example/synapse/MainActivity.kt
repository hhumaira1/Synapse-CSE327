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
import com.example.synapse.presentation.auth.SignInScreen
import com.example.synapse.presentation.auth.SignUpScreen
//import com.example.synapse.ui.theme.screens.CreateDeal
import com.example.synapse.presentation.LandingPage
import com.example.synapse.presentation.dashboard.OwnerDashboard
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
                onSignInSuccess = { navController.navigate("owner_dashboard") {
                    popUpTo("landing") { inclusive = true }
                }}
            )
        }
        
        composable("signup") {
            SignUpScreen(
                onNavigateToSignIn = { navController.navigate("signin") },
                onSignUpSuccess = { navController.navigate("owner_dashboard") {
                    popUpTo("landing") { inclusive = true }
                }}
            )
        }
        
        // Dashboard screens
        composable("owner_dashboard") {
            OwnerDashboard(
                isDarkMode = false,
                navController = navController,
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        
        // Feature screens
        composable("contacts/create") { CreateContact(
            navController,
            onSave = { /* Handle saved contact */ },
            onBack = { navController.popBackStack() }
        ) }
        //composable("deals/create") { CreateDeal(navController) }
    }
}


