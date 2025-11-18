package com.example.synapse.presentation.deals.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.graphics.toColorInt
import android.graphics.Color as PlatformColor
import com.example.synapse.data.model.Deal
import com.example.synapse.data.model.Stage

@Composable
fun DealKanbanColumn(
    stage: Stage,
    deals: List<Deal>,
    onDealClick: (Deal) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(300.dp)
            .fillMaxHeight(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp)
        ) {
            // Stage Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    // Stage color indicator
                    Surface(
                        color = Color(stage.color?.toColorInt() ?: PlatformColor.GRAY),
                        shape = MaterialTheme.shapes.small,
                        modifier = Modifier.size(12.dp)
                    ) {}
                    
                    Text(
                        text = stage.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                // Deal count badge
                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = deals.size.toString(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Total value for this stage
            if (deals.isNotEmpty()) {
                val totalValue = deals.sumOf { it.value }
                Text(
                    text = "$${String.format("%,.0f", totalValue)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(8.dp))
            }
            
            Divider()
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Deals list
            if (deals.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    contentAlignment = androidx.compose.ui.Alignment.Center
                ) {
                    Text(
                        text = "No deals",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(deals) { deal ->
                        DealKanbanCard(
                            deal = deal,
                            onClick = { onDealClick(deal) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DealKanbanCard(
    deal: Deal,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Deal title
            Text(
                text = deal.title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                maxLines = 2
            )
            
            // Contact name
            deal.contact?.let { contact ->
                Text(
                    text = "${contact.firstName} ${contact.lastName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Value
            Text(
                text = "$${String.format("%,.0f", deal.value)}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            // Probability badge
            val probabilityPercent = (deal.probability * 100).toInt()
            val probabilityColor = when {
                deal.probability >= 0.75 -> MaterialTheme.colorScheme.tertiary
                deal.probability >= 0.5 -> MaterialTheme.colorScheme.primary
                deal.probability >= 0.25 -> Color(0xFFFFA726) // Orange
                else -> MaterialTheme.colorScheme.error
            }
            
            Surface(
                color = probabilityColor.copy(alpha = 0.2f),
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = "$probabilityPercent%",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = probabilityColor
                )
            }
            
            // Expected close date
            deal.expectedCloseDate?.let { date ->
                Text(
                    text = "Close: ${date.take(10)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

