import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPersonById, getIssues, getReturns } from '@/lib/services/repository';
import { getCurrentUser } from '@/lib/actions/auth-actions';
import { canManagePeople } from '@/lib/auth/permissions';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PersonDetailActions } from '@/components/people/PersonDetailActions';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PersonDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const person = await getPersonById(id);
  return {
    title: person ? `${person.full_name} | Borrower Record` : 'Person Details',
  };
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { id } = await params;
  const [person, allIssues, allReturns, user] = await Promise.all([
    getPersonById(id),
    getIssues({ personId: id }),
    getReturns({ personId: id }),
    getCurrentUser(),
  ]);

  if (!person) {
    notFound();
  }

  const canManage = canManagePeople(user?.role);

  // Active items currently held by this person
  const activeIssues = allIssues.filter(
    (i) => i.status === 'ACTIVE' || i.status === 'PARTIALLY_RETURNED'
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-xs text-[#697077] hover:text-[#202326] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to People</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3E5E7] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-[#202326]">{person.full_name}</h1>
            <StatusBadge status={person.is_active ? 'Active' : 'Inactive'} size="sm" />
          </div>
          <p className="text-xs text-[#697077] mt-1 font-mono">
            {person.role} · {person.admission_number ? `ID: ${person.admission_number}` : 'Staff Member'}
          </p>
        </div>

        <PersonDetailActions person={person} canManage={canManage} />
      </div>

      {/* Person Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326] border-b border-[#E3E5E7] pb-2">
            Details
          </h2>

          <dl className="space-y-2 text-xs">
            <div>
              <dt className="text-[#697077]">Full Name</dt>
              <dd className="font-semibold text-[#202326] mt-0.5">{person.full_name}</dd>
            </div>

            <div>
              <dt className="text-[#697077]">Role</dt>
              <dd className="text-[#202326] mt-0.5">{person.role}</dd>
            </div>

            <div>
              <dt className="text-[#697077]">Admission / Staff ID</dt>
              <dd className="font-mono text-[#202326] mt-0.5">{person.admission_number || '—'}</dd>
            </div>

            <div>
              <dt className="text-[#697077]">Department / Class</dt>
              <dd className="text-[#202326] mt-0.5">
                {person.department || person.class_name || '—'}
              </dd>
            </div>

            <div>
              <dt className="text-[#697077]">Contact Info</dt>
              <dd className="text-[#202326] mt-0.5">
                {person.email && <div className="truncate">{person.email}</div>}
                {person.phone && <div>{person.phone}</div>}
                {!person.email && !person.phone && 'None registered'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Right 2 cols: Items Currently With This Person & Borrowing History */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 15: Items Currently With This Person */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Items Currently With This Person ({activeIssues.length})
              </h2>
            </div>

            {activeIssues.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                No items are currently with this person.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {activeIssues.map((issue) => (
                  <div key={issue.id} className="px-4 py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#202326]">
                        {issue.items.map((ii) => `${ii.item?.name || 'Item'} (${ii.quantity_issued - ii.quantity_returned} unit)`).join(', ')}
                      </div>
                      <div className="text-[#697077] mt-0.5">
                        Issued: {new Date(issue.created_at).toLocaleDateString()} · Due:{' '}
                        {issue.expected_return_date
                          ? new Date(issue.expected_return_date).toLocaleDateString()
                          : 'No return date'}
                      </div>
                    </div>

                    <Link
                      href={`/issues/${issue.id}`}
                      className="px-2.5 py-1 border border-[#E3E5E7] rounded text-[#202326] hover:bg-[#F1F3F2]"
                    >
                      View Issue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Borrowing History */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E7] rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E3E5E7]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#202326]">
                Borrowing History ({allIssues.length} issues · {allReturns.length} returns)
              </h2>
            </div>

            {allIssues.length === 0 ? (
              <div className="px-4 py-5 text-xs text-[#697077] text-center">
                No historical borrowing activity recorded for this person.
              </div>
            ) : (
              <div className="divide-y divide-[#E3E5E7]">
                {allIssues.map((issue) => (
                  <div key={issue.id} className="px-4 py-3 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[#697077]">{issue.issue_number}</span>
                      <div className="font-medium text-[#202326] mt-0.5">
                        {issue.items.map((ii) => `${ii.item?.name} (${ii.quantity_issued} units)`).join(', ')}
                      </div>
                      <div className="text-[#697077] text-[11px] mt-0.5">
                        Issued on {new Date(issue.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                          issue.status === 'RETURNED'
                            ? 'bg-[#F2F8F4] text-[#3F7654] border-[#D1E5D7]'
                            : 'bg-[#F0F4F8] text-[#34495E] border-[#E3E5E7]'
                        }`}
                      >
                        {issue.status}
                      </span>
                      <Link
                        href={`/issues/${issue.id}`}
                        className="p-1 text-[#697077] hover:text-[#202326]"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
