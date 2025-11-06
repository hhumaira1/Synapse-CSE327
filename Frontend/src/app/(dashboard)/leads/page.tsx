"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { useUserStatus } from "@/hooks/useUserStatus";
import { Lead, LeadStatus, LEAD_STATUS_CONFIG } from "@/types/lead";
import { LeadKanbanColumn } from "@/components/leads/LeadKanbanColumn";
import { CreateLeadDialog } from "@/components/leads/CreateLeadDialog";
import { EditLeadDialog } from "@/components/leads/EditLeadDialog";
import { ConvertLeadDialog } from "@/components/leads/ConvertLeadDialog";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export default function LeadsPage() {
  const { userExists } = useUserStatus();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (userExists) {
      fetchLeads();
    }
  }, [userExists]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Lead[]>("/leads");
      setLeads(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);

    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    const previousLeads = [...leads];
    setLeads(leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));

    try {
      await apiClient.patch(`/leads/${leadId}`, { status: newStatus });
      toast.success(`Lead moved to ${LEAD_STATUS_CONFIG[newStatus].label}`);
    } catch (error: unknown) {
      console.error("Failed to update lead status:", error);
      toast.error("Failed to update lead status");
      setLeads(previousLeads); // Revert on error
    }
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertDialogOpen(true);
  };

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === "" ||
      lead.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact?.lastName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource =
      filterSource === "" || lead.source.toLowerCase().includes(filterSource.toLowerCase());

    return matchesSearch && matchesSource;
  });

  // Group leads by status
  const leadsByStatus = Object.values(LeadStatus).reduce(
    (acc, status) => {
      acc[status] = filteredLeads.filter((lead) => lead.status === status);
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Track and manage your sales leads</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-linear-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9333ea]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by title or contact..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-64 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Filter by source..."
            value={filterSource}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterSource(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.values(LeadStatus).map((status) => (
            <LeadKanbanColumn
              key={status}
              status={status}
              leads={leadsByStatus[status]}
              onEdit={handleEdit}
              onConvert={handleConvert}
              onDelete={fetchLeads}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-blue-400 opacity-90">
              <h4 className="font-semibold text-sm">{activeLead.title}</h4>
              <p className="text-xs text-gray-600">
                {activeLead.contact?.firstName} {activeLead.contact?.lastName}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <CreateLeadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchLeads}
      />

      {selectedLead && (
        <>
          <EditLeadDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            lead={selectedLead}
            onSuccess={fetchLeads}
          />

          <ConvertLeadDialog
            open={convertDialogOpen}
            onOpenChange={setConvertDialogOpen}
            lead={selectedLead}
            onSuccess={fetchLeads}
          />
        </>
      )}
    </div>
  );
}
