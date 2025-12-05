"use client";

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Eye, ArrowUpDown } from 'lucide-react';

interface DataTableProps {
  type: 'contacts' | 'deals' | 'leads' | 'tickets';
  data: any[];
  onAction?: (action: 'edit' | 'delete' | 'view', id: string, item: any) => void;
}

export function DataTable({ type, data, onAction }: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search
  const filteredData = data.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get columns based on type
  const getColumns = () => {
    switch (type) {
      case 'contacts':
        return [
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'company', label: 'Company' },
        ];
      case 'deals':
        return [
          { key: 'title', label: 'Title' },
          { key: 'value', label: 'Value' },
          { key: 'probability', label: 'Probability' },
          { key: 'expectedCloseDate', label: 'Close Date' },
          { key: 'stage', label: 'Stage' },
        ];
      case 'leads':
        return [
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'email', label: 'Email' },
          { key: 'status', label: 'Status' },
          { key: 'source', label: 'Source' },
        ];
      case 'tickets':
        return [
          { key: 'title', label: 'Title' },
          { key: 'status', label: 'Status' },
          { key: 'priority', label: 'Priority' },
          { key: 'category', label: 'Category' },
          { key: 'assignedTo', label: 'Assigned To' },
        ];
      default:
        return [];
    }
  };

  const columns = getColumns();

  // Format cell value
  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    if (key === 'value') return `$${Number(value).toLocaleString()}`;
    if (key === 'probability') return `${value}%`;
    if (key === 'expectedCloseDate' && value) {
      return new Date(value).toLocaleDateString();
    }
    if (typeof value === 'object' && value.name) return value.name;
    return String(value);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Search ${type}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          {sortedData.length} {sortedData.length === 1 ? 'result' : 'results'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableCaption>
            {sortedData.length === 0 ? `No ${type} found` : `Total ${sortedData.length} ${type}`}
          </TableCaption>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                  No data to display
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item, idx) => (
                <TableRow key={item.id || idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {formatValue(item[col.key], col.key)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction?.('view', item.id, item)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction?.('edit', item.id, item)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAction?.('delete', item.id, item)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
