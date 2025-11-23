package com.example.synapse.presentation.settings.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.synapse.data.model.TeamMember
import com.example.synapse.data.model.UserRole

@Composable
fun TeamMemberCard(
    member: TeamMember,
    onRoleChange: () -> Unit,
    onRemove: () -> Unit,
    canManageTeam: Boolean,
    canRemove: Boolean
) {
    var showMenu by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar and info
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Avatar with initials
                Surface(
                    modifier = Modifier.size(48.dp),
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.primaryContainer
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = member.initials,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Name and email
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = member.fullName,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Bold
                        )
                        RoleBadge(role = member.role)
                    }
                    Text(
                        text = member.email,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Actions menu
            if (canManageTeam) {
                Box {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More options")
                    }

                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Change Role") },
                            onClick = {
                                showMenu = false
                                onRoleChange()
                            }
                        )
                        if (canRemove) {
                            DropdownMenuItem(
                                text = { Text("Remove", color = MaterialTheme.colorScheme.error) },
                                onClick = {
                                    showMenu = false
                                    onRemove()
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RoleBadge(role: UserRole) {
    val (backgroundColor, textColor) = when (role) {
        UserRole.ADMIN -> Pair(Color(0xFFa855f7), Color.White)  // Purple
        UserRole.MANAGER -> Pair(Color(0xFF3b82f6), Color.White) // Blue
        UserRole.MEMBER -> Pair(Color(0xFF6b7280), Color.White)  // Gray
    }

    Surface(
        color = backgroundColor,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = role.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            fontWeight = FontWeight.Bold
        )
    }
}
