package com.example.synapse.ui.theme.screens
//
//import androidx.compose.foundation.background
//import androidx.compose.foundation.layout.Arrangement
//import androidx.compose.foundation.layout.Box
//import androidx.compose.foundation.layout.Column
//import androidx.compose.foundation.layout.Spacer
//import androidx.compose.foundation.layout.fillMaxSize
//import androidx.compose.foundation.layout.height
//import androidx.compose.material3.Button
//import androidx.compose.material3.Text
//import androidx.compose.runtime.Composable
//import androidx.compose.ui.Alignment
//import androidx.compose.ui.Modifier
//import androidx.compose.ui.graphics.Color
//import androidx.compose.ui.text.font.FontWeight
//import androidx.compose.ui.unit.dp
//import androidx.compose.ui.unit.sp
//import androidx.navigation.NavController
//import com.example.synapse.ui.theme.Purple1
//
//@Composable
//fun HomePage(navController: NavController) {
//
//        Box(
//            modifier = Modifier
//                .fillMaxSize()
//                .background(Color.White),
//            contentAlignment = Alignment.Center
//        ) {
//            Column(horizontalAlignment = Alignment.CenterHorizontally) {
//                Text(
//                    text = "Welcome to your Dashboard!",
//                    fontSize = 24.sp,
//                    fontWeight = FontWeight.Bold,
//                    color = Purple1
//                )
//
//                Spacer(modifier = Modifier.height(20.dp))
//
//                Button(onClick = { navController.navigate("landing") }) {
//                    Text(text = "Back to Landing")
//                }
//            }
//        }
//
//    }