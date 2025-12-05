import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { AssemblyAI } from 'assemblyai';
import { ConfigService } from '@nestjs/config';

/**
 * TranscriptionService
 * 
 * Uses AssemblyAI for call transcription (100 hours/month free tier)
 * 
 * Features:
 * - Automatic speech recognition
 * - Speaker diarization (who said what)
 * - Auto-generated summaries
 * - Keyword extraction
 * - Sentiment analysis
 * 
 * Alternative (commented): OpenAI Whisper for self-hosted option
 */
@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private assemblyai: AssemblyAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('ASSEMBLYAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('AssemblyAI API key not configured. Transcription will not work.');
      this.logger.warn('Free tier: 100 hours/month at https://www.assemblyai.com/');
      return;
    }

    this.assemblyai = new AssemblyAI({ apiKey });
    this.logger.log('✅ Transcription service initialized with AssemblyAI');
  }

  /**
   * Start transcription for a call recording
   */
  async startTranscription(callLogId: string): Promise<void> {
    if (!this.assemblyai) {
      this.logger.warn('AssemblyAI not configured, skipping transcription');
      return;
    }

    try {
      // Get recording
      const recording = await this.prisma.callRecording.findUnique({
        where: { callLogId },
        include: { callLog: true },
      });

      if (!recording || recording.status !== 'COMPLETED') {
        this.logger.warn(`Recording not ready for transcription: ${callLogId}`);
        return;
      }

      // Create transcription record
      const transcription = await this.prisma.callTranscription.create({
        data: {
          callLogId,
          tenantId: recording.tenantId,
          fullText: '',
          segments: [],
          provider: 'ASSEMBLYAI',
          status: 'PROCESSING',
        },
      });

      this.logger.log(`🎙️ Starting transcription for call ${callLogId}`);

      // Submit to AssemblyAI
      const transcript = await this.assemblyai.transcripts.transcribe({
        audio_url: recording.fileUrl,
        speaker_labels: true, // Enable speaker diarization
        auto_highlights: true, // Extract keywords
        sentiment_analysis: true, // Analyze sentiment
        summarization: true, // Generate summary
        summary_model: 'informative',
        summary_type: 'bullets',
      });

      if (transcript.status === 'error') {
        throw new Error(transcript.error);
      }

      // Extract segments with speaker labels
      const segments = transcript.utterances?.map((utterance) => ({
        speaker: `Speaker ${utterance.speaker}`,
        text: utterance.text,
        startTime: utterance.start / 1000, // Convert ms to seconds
        endTime: utterance.end / 1000,
        confidence: utterance.confidence,
      })) || [];

      // Extract keywords
      const autoHighlights = transcript.auto_highlights as any;
      const keywords = (
        autoHighlights && typeof autoHighlights === 'object' && autoHighlights.results
      )
        ? autoHighlights.results
            .flatMap((result: any) => result.text)
            .filter((text: string, index: number, self: string[]) => self.indexOf(text) === index)
        : [];

      // Determine overall sentiment
      const sentiments = transcript.sentiment_analysis_results || [];
      const positiveCount = sentiments.filter((s) => s.sentiment === 'POSITIVE').length;
      const negativeCount = sentiments.filter((s) => s.sentiment === 'NEGATIVE').length;
      const sentiment = positiveCount > negativeCount
        ? 'POSITIVE'
        : negativeCount > positiveCount
        ? 'NEGATIVE'
        : 'NEUTRAL';

      // Update transcription
      await this.prisma.callTranscription.update({
        where: { id: transcription.id },
        data: {
          fullText: transcript.text || '',
          segments,
          summary: transcript.summary || null,
          keywords,
          sentiment,
          confidence: transcript.confidence || 0,
          wordCount: transcript.words?.length || 0,
          providerId: transcript.id,
          status: 'COMPLETED',
        },
      });

      this.logger.log(`✅ Transcription completed for call ${callLogId}`);
      this.logger.log(`   Words: ${transcript.words?.length || 0}, Speakers: ${segments.length}`);
      this.logger.log(`   Sentiment: ${sentiment}, Keywords: ${keywords.slice(0, 5).join(', ')}`);

    } catch (error) {
      this.logger.error(`Failed to transcribe call ${callLogId}`, error);
      
      // Mark as failed
      await this.prisma.callTranscription.updateMany({
        where: { callLogId },
        data: { status: 'FAILED' },
      });
    }
  }

  /**
   * Get transcription for a call
   */
  async getTranscription(callLogId: string) {
    return this.prisma.callTranscription.findUnique({
      where: { callLogId },
    });
  }

  /**
   * Search transcriptions by keyword
   */
  async searchTranscriptions(tenantId: string, keyword: string) {
    return this.prisma.callTranscription.findMany({
      where: {
        tenantId,
        OR: [
          { fullText: { contains: keyword, mode: 'insensitive' } },
          { keywords: { has: keyword } },
        ],
      },
      include: {
        callLog: {
          select: {
            id: true,
            startTime: true,
            duration: true,
            callerSupabaseId: true,
            calleeSupabaseId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

/* 
 * ============================================================================
 * ALTERNATIVE: OpenAI Whisper (Self-Hosted) - Commented for Future Use
 * ============================================================================
 * 
 * If you want to switch to self-hosted Whisper (100% free, no limits):
 * 
 * 1. Run Whisper API server:
 *    docker run -d -p 9000:9000 onerahmet/openai-whisper-asr-webservice:latest
 * 
 * 2. Replace AssemblyAI code with:
 * 
 * async startTranscription(callLogId: string): Promise<void> {
 *   const recording = await this.prisma.callRecording.findUnique({
 *     where: { callLogId },
 *     include: { callLog: true },
 *   });
 * 
 *   if (!recording) return;
 * 
 *   // Download audio file
 *   const response = await fetch(recording.fileUrl);
 *   const audioBuffer = await response.arrayBuffer();
 * 
 *   // Send to Whisper API
 *   const formData = new FormData();
 *   formData.append('audio_file', new Blob([audioBuffer]), 'audio.webm');
 *   formData.append('task', 'transcribe');
 *   formData.append('language', 'en');
 * 
 *   const whisperResponse = await fetch('http://localhost:9000/asr', {
 *     method: 'POST',
 *     body: formData,
 *   });
 * 
 *   const result = await whisperResponse.json();
 * 
 *   await this.prisma.callTranscription.create({
 *     data: {
 *       callLogId,
 *       tenantId: recording.tenantId,
 *       fullText: result.text,
 *       segments: result.segments || [],
 *       provider: 'LIVEKIT', // or 'WHISPER'
 *       status: 'COMPLETED',
 *     },
 *   });
 * }
 * 
 * Pros: 100% free, no limits, works offline
 * Cons: Requires Docker server, no speaker diarization/sentiment
 */
