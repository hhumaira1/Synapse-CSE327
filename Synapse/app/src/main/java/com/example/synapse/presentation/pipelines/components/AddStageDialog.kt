package com.example.synapse.presentation.pipelines.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.synapse.data.model.Pipeline

@Composable
fun AddStageDialog(
    pipeline: Pipeline,
    isAdding: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (name: String, color: String) -> Unit
) {
    var stageName by remember { mutableStateOf("") }
    var selectedColor by remember { mutableStateOf("#9333EA") }
    var nameError by remember { mutableStateOf(false) }

    val predefinedColors = listOf(
        "#9333EA" to "Purple",
        "#2563EB" to "Blue",
        "#059669" to "Green",
        "#DC2626" to "Red",
        "#D97706" to "Orange",
        "#7C3AED" to "Violet",
        "#0891B2" to "Cyan",
        "#EC4899" to "Pink",
        "#84CC16" to "Lime",
        "#6366F1" to "Indigo"
    )

    Dialog(onDismissRequest = { if (!isAdding) onDismiss() }) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        Icons.Default.Add,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(28.dp)
                    )
                    Column {
                        Text(
                            text = "Add Stage",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = pipeline.name,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = stageName,
                    onValueChange = {
                        stageName = it
                        nameError = false
                    },
                    label = { Text("Stage Name *") },
                    isError = nameError,
                    supportingText = {
                        if (nameError) {
                            Text(
                                text = "Stage name is required",
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !isAdding
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Stage Color",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(8.dp))

                LazyVerticalGrid(
                    columns = GridCells.Fixed(5),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.heightIn(max = 120.dp)
                ) {
                    items(predefinedColors) { (hex, name) ->
                        ColorOption(
                            color = Color(android.graphics.Color.parseColor(hex)),
                            name = name,
                            isSelected = selectedColor == hex,
                            onClick = { selectedColor = hex },
                            enabled = !isAdding
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        enabled = !isAdding
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            if (stageName.isBlank()) {
                                nameError = true
                            } else {
                                onConfirm(stageName, selectedColor)
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = !isAdding
                    ) {
                        if (isAdding) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        } else {
                            Text("Add Stage")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ColorOption(
    color: Color,
    name: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    enabled: Boolean
) {
    Box(
        modifier = Modifier
            .size(48.dp)
            .clip(CircleShape)
            .background(color)
            .then(
                if (isSelected) {
                    Modifier.border(3.dp, MaterialTheme.colorScheme.primary, CircleShape)
                } else {
                    Modifier
                }
            )
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (isSelected) {
            Icon(
                Icons.Default.Check,
                contentDescription = name,
                tint = Color.White,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}
