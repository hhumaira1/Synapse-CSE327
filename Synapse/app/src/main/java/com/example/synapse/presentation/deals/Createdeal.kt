package com.example.synapse.presentation.deals
//
//import androidx.compose.foundation.clickable
//import androidx.compose.foundation.layout.*
//import androidx.compose.foundation.text.KeyboardOptions
//import androidx.compose.material.icons.Icons
//import androidx.compose.material.icons.automirrored.filled.ArrowBack
//import androidx.compose.material3.*
//import androidx.compose.runtime.*
//import androidx.compose.ui.Alignment
//import androidx.compose.ui.Modifier
//import androidx.compose.ui.text.input.KeyboardType
//import androidx.compose.ui.unit.dp
//import androidx.navigation.NavController
//
//@Composable
//fun CreateDeal(
//    navController: NavController,
//    contacts: List<Contact> = emptyList(),
//    onCreateDeal: (Deal) -> Unit = {}
//) {
//    var title by remember { mutableStateOf("") }
//    var selectedContact by remember { mutableStateOf<Contact?>(null) }
//    var value by remember { mutableStateOf("") }
//    var probability by remember { mutableStateOf("") }
//    var expectedCloseDate by remember { mutableStateOf("") }
//    var note by remember { mutableStateOf("") }
//
//    Column(
//        modifier = Modifier
//            .fillMaxSize()
//            .padding(16.dp),
//        verticalArrangement = Arrangement.spacedBy(12.dp)
//    ) {
//        Text("Create New Deal", style = MaterialTheme.typography.headlineSmall)
//
//        OutlinedTextField(
//            value = title,
//            onValueChange = { title = it },
//            label = { Text("Deal Title *") },
//            singleLine = true
//        )
//
//        // Contact dropdown
//        var expanded by remember { mutableStateOf(false) }
//        Box {
//            OutlinedTextField(
//                value = selectedContact?.let { "${it.firstName} ${it.lastName}" } ?: "",
//                onValueChange = {},
//                label = { Text("Select Contact *") },
//                readOnly = true,
//                modifier = Modifier.fillMaxWidth()
//            )
//            DropdownMenu(
//                expanded = expanded,
//                onDismissRequest = { expanded = false }
//            ) {
//                contacts.forEach { contact ->
//                    DropdownMenuItem(
//                        onClick = {
//                            selectedContact = contact
//                            expanded = false
//                        },
//                        text = TODO(),
//                        modifier = TODO(),
//                        leadingIcon = TODO(),
//                        trailingIcon = TODO(),
//                        enabled = TODO(),
//                        colors = TODO(),
//                        contentPadding = TODO(),
//                        interactionSource = TODO()
//                    ) ,{
//                    Text("${contact.firstName} ${contact.lastName}") }
//                }
//            }
//            Spacer(
//                modifier = Modifier
//                    .matchParentSize()
//                    .clickable { expanded = true }
//            )
//        }
//
//        OutlinedTextField(
//            value = value,
//            onValueChange = { value = it },
//            label = { Text("Value (Cash Amount) *") },
//            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
//        )
//        OutlinedTextField(
//            value = probability,
//            onValueChange = { probability = it },
//            label = { Text("Probability (%)") },
//            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
//        )
//        OutlinedTextField(
//            value = expectedCloseDate,
//            onValueChange = { expectedCloseDate = it },
//            label = { Text("Expected Close Date") },
//            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text)
//        )
//        OutlinedTextField(
//            value = note,
//            onValueChange = { note = it },
//            label = { Text("Additional Note") },
//            maxLines = 4
//        )
//
//        Button(
//            onClick = {
//                if (title.isNotBlank() && selectedContact != null && value.isNotBlank()) {
//                    val deal = Deal(
//                        title, selectedContact!!, value.toDoubleOrNull() ?: 0.0,
//                        probability.toDoubleOrNull() ?: 0.0, expectedCloseDate, note
//                    )
//                    onCreateDeal(deal)
//                    navController.popBackStack()
//                } else {
//                    // Show error snackbar
//                }
//            },
//            modifier = Modifier.fillMaxWidth()
//        ) {
//            Text("Create Deal")
//        }
//    }
//}
//
//data class Deal(
//    val title: String,
//    val contact: Contact,
//    val value: Double,
//    val probability: Double,
//    val expectedCloseDate: String,
//    val note: String
//)
