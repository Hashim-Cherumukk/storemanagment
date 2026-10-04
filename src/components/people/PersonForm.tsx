'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personSchema, PersonFormValues } from '@/lib/validations';
import { createPersonAction } from '@/lib/actions/people-actions';
import { useToast } from '@/components/ui/Toast';
import { AlertCircle, ArrowLeft, Save, User, Building, Mail, Phone, Hash } from 'lucide-react';
import Link from 'next/link';

export function PersonForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      full_name: '',
      admission_number: '',
      role: 'STUDENT',
      department: '',
      class_name: '',
      phone: '',
      email: '',
      photo_url: '',
      is_active: true,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: PersonFormValues) => {
    setServerError(null);

    try {
      const res = await createPersonAction(values);
      if (res.success && res.personId) {
        showToast(`Registered "${values.full_name}" successfully.`, 'success');
        router.push(`/people/${res.personId}`);
        router.refresh();
      } else {
        setServerError(res.error || 'Failed to register person.');
        showToast(res.error || 'Failed to register person.', 'error');
      }
    } catch {
      setServerError('An unexpected network or server error occurred.');
      showToast('An unexpected error occurred.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      <div>
        <Link
          href="/people"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to People Registry</span>
        </Link>
      </div>

      {serverError && (
        <div
          className="p-4 rounded-xl bg-danger-bg border border-[#F0C4C3] text-danger text-sm flex items-start gap-3"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Unable to register person</h4>
            <p className="text-xs mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-xs space-y-6">
        <div className="border-b border-border-subtle pb-3">
          <h2 className="text-base font-bold text-text-main">
            Personal & Institutional Affiliation
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Register students, faculty, or operational staff for future store checkouts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="full_name"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              Full Name <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="full_name"
                type="text"
                {...register('full_name')}
                placeholder="e.g. Marcus Vance or Dr. Arthur Pendelton"
                className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-danger mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label
              htmlFor="role"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              Affiliation Role <span className="text-danger">*</span>
            </label>
            <select
              id="role"
              {...register('role')}
              className="w-full px-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors cursor-pointer"
            >
              <option value="STUDENT">STUDENT</option>
              <option value="TEACHER">TEACHER (Faculty)</option>
              <option value="STAFF">STAFF (Institutional Personnel)</option>
              <option value="OTHER">OTHER (Contractor / Guest)</option>
            </select>
            {errors.role && (
              <p className="text-xs text-danger mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Admission Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admission_number"
                className="block text-xs font-semibold text-text-main uppercase tracking-wider"
              >
                Admission / Staff ID
              </label>
              <span className="text-[11px] text-text-muted font-mono">
                {selectedRole === 'STUDENT' ? 'Required for students' : 'Optional'}
              </span>
            </div>
            <div className="relative">
              <Hash className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admission_number"
                type="text"
                {...register('admission_number')}
                placeholder="e.g. STU-2024-0089"
                className="w-full pl-10 pr-3.5 py-2 font-mono uppercase bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
              />
            </div>
            {errors.admission_number && (
              <p className="text-xs text-danger mt-1">{errors.admission_number.message}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="department"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              Department / Faculty
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="department"
                type="text"
                {...register('department')}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
              />
            </div>
            {errors.department && (
              <p className="text-xs text-danger mt-1">{errors.department.message}</p>
            )}
          </div>

          {/* Class Name (for students) */}
          <div>
            <label
              htmlFor="class_name"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              Class / Section
            </label>
            <input
              id="class_name"
              type="text"
              {...register('class_name')}
              placeholder="e.g. CSE-3A or Year 2 Semester 1"
              className="w-full px-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
            />
            {errors.class_name && (
              <p className="text-xs text-danger mt-1">{errors.class_name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="phone"
                type="text"
                {...register('phone')}
                placeholder="+1 (555) 012-3456"
                className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-danger mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="name@student.apex.edu"
                className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-danger mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Photo URL */}
          <div className="sm:col-span-2">
            <label
              htmlFor="photo_url"
              className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
            >
              ID Card Photo URL (Optional)
            </label>
            <input
              id="photo_url"
              type="text"
              {...register('photo_url')}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-colors"
            />
            {errors.photo_url && (
              <p className="text-xs text-danger mt-1">{errors.photo_url.message}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="sm:col-span-2 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border-subtle cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-text-main block">
                  Eligible for Equipment Checkout
                </span>
                <span className="text-xs text-text-muted">
                  Keep active to allow issuing items to this borrower.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link
          href="/people"
          className="px-4 py-2.5 text-xs font-semibold text-text-main hover:bg-warm-bg rounded-lg border border-border-subtle transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Person</span>
        </button>
      </div>
    </form>
  );
}
