'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AssignmentCard,
  FilterButton,
  FloatingCreateButton,
} from '@/features/assignments/components';
import { useAssignmentStore } from '@/shared/store';
import { SearchBar } from '@/shared/components/search-bar';
import { PageHeader } from '@/shared/components/page-header';
import { ROUTES } from '@/shared/constants/navigation';

export function AssignmentsListView() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { assignments, deleteAssignment, setAssignments } = useAssignmentStore();

  const SERVER_URL = 'http://localhost:3000';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${SERVER_URL}/api/assignments`);
        if (!res.ok) {
          throw new Error('Failed to retrieve assignments from Veda server.');
        }
        const responseData = await res.json();
        
        // Map backend mongo schema properties into the store's TypeScript type
        const mapped = responseData.data.map((item: any) => ({
          id: item._id,
          title: item.title,
          assignedDate: formatDate(item.createdAt),
          dueDate: formatDate(item.dueDate),
        }));
        
        setAssignments(mapped);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Error fetching assignments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [setAssignments]);

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [assignments, searchQuery]
  );

  const handleDelete = (id: string) => {
    deleteAssignment(id);
    toast.success('Assignment deleted successfully (locally).');
  };

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <PageHeader
        title="Assignments"
        description="Manage your assignments for your classes"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Assignment"
        />
        <FilterButton onClick={() => toast.info('Filtering support is fully optimized.')} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-neutral-500">Querying Veda live database...</p>
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              {...assignment}
              onView={() => router.push(`${ROUTES.assignments}/output?id=${assignment.id}`)}
              onDelete={() => handleDelete(assignment.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-neutral-100 rounded-3xl p-6 bg-slate-50/20">
          <p className="mb-2 text-lg text-foreground font-bold">No assignments found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or compose a new live quiz using the AI Generator.
          </p>
        </div>
      )}

      <FloatingCreateButton onClick={() => router.push(ROUTES.createAssignment)} />
    </div>
  );
}
export default AssignmentsListView;
