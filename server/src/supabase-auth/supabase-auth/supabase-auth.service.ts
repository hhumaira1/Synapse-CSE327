import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseAuthService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables',
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Verify JWT token from Authorization header
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error) {
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, metadata?: object) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  /**
   * Sign out
   */
  async signOut() {
    return this.supabase.auth.signOut();
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email);
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(userId: string, metadata: object) {
    return this.supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });
  }
}
