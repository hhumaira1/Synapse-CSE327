'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Workflow } from 'lucide-react';
import { useUserStatus } from '@/hooks/useUserStatus';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { CreatePipelineDialog } from '@/components/pipelines/CreatePipelineDialog';
import { PipelineCard } from '@/components/pipelines/PipelineCard';

interface Stage {
  id: string;
  name: string;
  order: number;
  _count: {
    deals: number;
  };
}

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: Stage[];
  _count: {
    deals: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function PipelinesPage() {
  const { userExists } = useUserStatus();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch pipelines with React Query caching
  const { data: pipelines = [], isLoading, refetch, error } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const response = await apiClient.get<Pipeline[]>('/pipelines');
      return response.data;
    },
    enabled: userExists, // Only fetch when user exists
    staleTime: 60 * 1000, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  // Handle errors in component (React Query v5)
  if (error) {
    console.error('Error fetching pipelines:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load pipelines';
    toast.error(errorMessage);
  }

  const handlePipelineCreated = () => {
    refetch();
    setCreateDialogOpen(false);
  };

  const handlePipelineUpdated = () => {
    refetch();
  };

  const handlePipelineDeleted = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Pipelines</h1>
          <p className="text-gray-600 mt-1">
            Manage your sales processes and deal stages
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>

      {/* Pipelines Grid */}
      {pipelines.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Workflow className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No pipelines yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first sales pipeline to start managing deals
          </p>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onUpdate={handlePipelineUpdated}
              onDelete={handlePipelineDeleted}
            />
          ))}
        </div>
      )}

      {/* Create Pipeline Dialog */}
      <CreatePipelineDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handlePipelineCreated}
      />
    </div>
  );
}
