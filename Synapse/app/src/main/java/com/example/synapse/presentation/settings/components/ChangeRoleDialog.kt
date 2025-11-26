package com.example.synapse.presentation.settings.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.synapse.data.model.TeamMember
import com.example.synapse.data.model.UserRole

@Composable
fun ChangeRoleDialog(
    member: TeamMember,
    onDismiss: () -> Unit,
    onConfirm: (UserRole) -> Unit,
    isLoading: Boolean
) {
    var selectedRole by remember { mutableStateOf(member.role) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Role") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Change role for ${member.fullName}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Current role: ${member.role.name}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Divider()

                // Role selector with radio buttons
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    UserRole.values().forEach { role ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .selectable(
                                    selected = selectedRole == role,
                                    onClick = { selectedRole = role },
                                    enabled = !isLoading
                                ),
                            colors = if (selectedRole == role) {
                                CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer
                                )
                            } else {
                                CardDefaults.cardColors()
                            }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = role.name,
                                        style = MaterialTheme.typography.bodyLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = getRoleDescription(role),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                RadioButton(
                                    selected = selectedRole == role,
                                    onClick = { selectedRole = role },
                                    enabled = !isLoading
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(selectedRole) },
                enabled = !isLoading && selectedRole != member.role
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Save")
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
        UserRole.ADMIN -> "Full access to all features"
        UserRole.MANAGER -> "Manage teams and customers"
        UserRole.MEMBER -> "Customer dashboard access"
    }
}
