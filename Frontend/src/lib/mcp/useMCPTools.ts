/**
 * React hook for MCP tools
 * Automatically uses Supabase JWT for authentication
 */

import { useState } from 'react';
import { mcpClient } from './client';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';

export function useMCPTools() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const session = useSession();

    const callTool = async (
        toolName: string,
        args: Record<string, any> = {}
    ): Promise<string> => {
        if (!session?.access_token) {
            throw new Error('Not authenticated');
        }

        setLoading(true);
        setError(null);

        try {
            const result = await mcpClient.callTool(
                toolName,
                args,
                session.access_token
            );
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const listTools = async () => {
        setLoading(true);
        setError(null);

        try {
            return await mcpClient.listTools();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        callTool,
        listTools,
        loading,
        error,
    };
}
