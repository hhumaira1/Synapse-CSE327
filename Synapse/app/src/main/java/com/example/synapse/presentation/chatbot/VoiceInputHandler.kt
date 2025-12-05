package com.example.synapse.presentation.chatbot

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Voice input handler using Android SpeechRecognizer
 * 
 * Features:
 * - Real-time speech-to-text transcription
 * - Error handling with user-friendly messages
 * - Recording state management
 * - Automatic cleanup on destroy
 */
class VoiceInputHandler(private val context: Context) {
    
    private var speechRecognizer: SpeechRecognizer? = null
    
    private val _voiceState = MutableStateFlow(VoiceInputState())
    val voiceState: StateFlow<VoiceInputState> = _voiceState.asStateFlow()
    
    init {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context)
            setupRecognitionListener()
        }
    }
    
    /**
     * Check if speech recognition is available on device
     */
    fun isAvailable(): Boolean {
        return SpeechRecognizer.isRecognitionAvailable(context)
    }
    
    /**
     * Start listening for voice input
     */
    fun startListening() {
        if (speechRecognizer == null) {
            _voiceState.value = VoiceInputState(
                error = "Speech recognition not available on this device"
            )
            return
        }
        
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        
        _voiceState.value = VoiceInputState(isListening = true)
        speechRecognizer?.startListening(intent)
    }
    
    /**
     * Stop listening
     */
    fun stopListening() {
        speechRecognizer?.stopListening()
        _voiceState.value = VoiceInputState(isListening = false)
    }
    
    /**
     * Cancel listening
     */
    fun cancelListening() {
        speechRecognizer?.cancel()
        _voiceState.value = VoiceInputState()
    }
    
    /**
     * Setup recognition listener callbacks
     */
    private fun setupRecognitionListener() {
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                _voiceState.value = _voiceState.value.copy(
                    isListening = true,
                    error = null
                )
            }
            
            override fun onBeginningOfSpeech() {
                _voiceState.value = _voiceState.value.copy(
                    isListening = true,
                    isSpeaking = true
                )
            }
            
            override fun onRmsChanged(rmsdB: Float) {
                // Update audio level for visualizer
                _voiceState.value = _voiceState.value.copy(
                    audioLevel = rmsdB
                )
            }
            
            override fun onBufferReceived(buffer: ByteArray?) {
                // Audio buffer received
            }
            
            override fun onEndOfSpeech() {
                _voiceState.value = _voiceState.value.copy(
                    isSpeaking = false
                )
            }
            
            override fun onError(error: Int) {
                val errorMessage = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                    SpeechRecognizer.ERROR_CLIENT -> "Client error"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission required"
                    SpeechRecognizer.ERROR_NETWORK -> "Network error"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                    SpeechRecognizer.ERROR_NO_MATCH -> "No speech detected"
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
                    SpeechRecognizer.ERROR_SERVER -> "Server error"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
                    else -> "Recognition error"
                }
                
                _voiceState.value = VoiceInputState(
                    isListening = false,
                    error = errorMessage
                )
            }
            
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val transcription = matches?.firstOrNull() ?: ""
                
                _voiceState.value = VoiceInputState(
                    isListening = false,
                    transcription = transcription,
                    isComplete = true
                )
            }
            
            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val partialTranscription = matches?.firstOrNull() ?: ""
                
                _voiceState.value = _voiceState.value.copy(
                    transcription = partialTranscription,
                    isPartial = true
                )
            }
            
            override fun onEvent(eventType: Int, params: Bundle?) {
                // Custom events
            }
        })
    }
    
    /**
     * Cleanup resources
     */
    fun destroy() {
        speechRecognizer?.destroy()
        speechRecognizer = null
    }
}

/**
 * Voice input state
 */
data class VoiceInputState(
    val isListening: Boolean = false,
    val isSpeaking: Boolean = false,
    val transcription: String = "",
    val isPartial: Boolean = false,
    val isComplete: Boolean = false,
    val audioLevel: Float = 0f,
    val error: String? = null
)
