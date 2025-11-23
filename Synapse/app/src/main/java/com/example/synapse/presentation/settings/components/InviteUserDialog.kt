package com.example.synapse.presentation.settings.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.font.FontWeight
import com.example.synapse.data.model.UserRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InviteUserDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, UserRole) -> Unit,
    isLoading: Boolean
) {
    var email by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf(UserRole.MEMBER) }
    var roleExpanded by remember { mutableStateOf(false) }
    var emailError by remember { mutableStateOf(false) }

    val isEmailValid = android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Invite Team Member") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Email input
                OutlinedTextField(
                    value = email,
                    onValueChange = {
                        email = it
                        emailError = false
                    },
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    isError = emailError,
                    supportingText = if (emailError) {
                        { Text("Please enter a valid email address") }
                    } else null,
                    singleLine = true,
                    enabled = !isLoading
                )

                // Role selector
                ExposedDropdownMenuBox(
                    expanded = roleExpanded,
                    onExpandedChange = { roleExpanded = !roleExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedRole.name,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Role") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = roleExpanded) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        enabled = !isLoading
                    )

                    ExposedDropdownMenu(
                        expanded = roleExpanded,
                        onDismissRequest = { roleExpanded = false }
                    ) {
                        UserRole.values().forEach { role ->
                            DropdownMenuItem(
                                text = {
                                    Column {
                                        Text(role.name, fontWeight = FontWeight.Bold)
                                        Text(
                                            text = getRoleDescription(role),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                },
                                onClick = {
                                    selectedRole = role
                                    roleExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (email.isBlank() || !isEmailValid) {
                        emailError = true
                    } else {
                        onConfirm(email, selectedRole)
                    }
                },
                enabled = !isLoading && email.isNotBlank()
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Send Invite")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isLoading
            ) {
                Text("Cancel")
            }
        }
    )
}

private fun getRoleDescription(role: UserRole): String {
    return when (role) {
        UserRole.ADMIN -> "Full access to all features and settings"
        UserRole.MANAGER -> "Can manage teams and customers"
        UserRole.MEMBER -> "Access to customer dashboard only"
    }
}
