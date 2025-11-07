package com.example.synapse

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.synapse.ui.theme.SynapseTheme
import com.example.synapse.ui.theme.screens.LandingPage
import com.example.synapse.ui.theme.screens.OwnerDashboard

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
        NavGraph(navController = navController,
            modifier = Modifier.padding(paddingValues))
    }
}

@Composable
fun NavGraph(navController: NavHostController, modifier: Modifier = Modifier) {
    NavHost(
        navController = navController,
        startDestination = "landing",
        modifier = modifier
    ) {
        composable("landing") { LandingPage(navController) }
        composable("signin") { /* TODO: SignInScreen(navController) */ }
        composable("signup") { /* TODO: SignUpScreen(navController) */ }
        composable("owner_dashboard") {
            OwnerDashboard(
                isDarkMode = false,
                onNavigate = { route ->
                    navController.navigate(route)
                }
//                onBack = {
//                    // Pop back to landing page
//                    navController.popBackStack()
//                }
            )
        }
        composable ("home") { /* TODO: HomeScreen(navController) */ }
    }
}


