'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  institutionSettingsSchema,
  InstitutionSettingsFormValues,
} from '@/lib/validations';
import { InstitutionSettings, Profile } from '@/types/database';
import { updateInstitutionSettingsAction } from '@/lib/actions/settings-actions';
import { useToast } from '@/components/ui/Toast';
import {
  Building2,
  User,
  Palette,
  Save,
  Mail,
  Phone,
  MapPin,
  Image,
  Shield,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SettingsManagerProps {
  settings: InstitutionSettings;
  currentUser: Profile | null;
  canEditSettings: boolean;
}

export function SettingsManager({
  settings,
  currentUser,
  canEditSettings,
}: SettingsManagerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'institution' | 'profile'>('institution');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionSettingsFormValues>({
    resolver: zodResolver(institutionSettingsSchema),
    defaultValues: {
      institution_name: settings.institution_name,
      logo_url: settings.logo_url || '',
      address: settings.address || '',
      phone: settings.phone || '',
      email: settings.email || '',
    },
  });

  const onSubmit = async (values: InstitutionSettingsFormValues) => {
    setServerError(null);
    try {
      const res = await updateInstitutionSettingsAction(values);
      if (res.success) {
        showToast('Institution settings updated successfully.', 'success');
        router.refresh();
      } else {
        setServerError(res.error || 'Failed to update settings.');
        showToast(res.error || 'Failed to update settings.', 'error');
      }
    } catch {
      setServerError('An unexpected error occurred.');
      showToast('An unexpected error occurred.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('institution')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'institution'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institution Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <User className="w-4 h-4" />
          <span>User Profile</span>
        </button>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-danger-bg border border-[#F0C4C3] text-danger text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Tab 1: Institution Profile */}
      {activeTab === 'institution' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-xs space-y-5">
            <div className="border-b border-border-subtle pb-3">
              <h2 className="text-base font-bold text-text-main">
                Institutional Details
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Central identity displayed on operational store documents and slips.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label
                  htmlFor="institution_name"
                  className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
                >
                  Institution / Organization Name <span className="text-danger">*</span>
                </label>
                <input
                  id="institution_name"
                  type="text"
                  disabled={!canEditSettings}
                  {...register('institution_name')}
                  className="w-full px-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:bg-warm-bg/50"
                />
                {errors.institution_name && (
                  <p className="text-xs text-danger mt-1">{errors.institution_name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
                >
                  Central Store Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="phone"
                    type="text"
                    disabled={!canEditSettings}
                    {...register('phone')}
                    className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:bg-warm-bg/50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
                >
                  Store Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    disabled={!canEditSettings}
                    {...register('email')}
                    className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:bg-warm-bg/50"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
                >
                  Campus Location & Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="address"
                    type="text"
                    disabled={!canEditSettings}
                    {...register('address')}
                    className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:bg-warm-bg/50"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="logo_url"
                  className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5"
                >
                  Institution Seal / Logo URL (Optional)
                </label>
                <div className="relative">
                  <Image className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="logo_url"
                    type="text"
                    disabled={!canEditSettings}
                    {...register('logo_url')}
                    placeholder="https://..."
                    className="w-full pl-10 pr-3.5 py-2 bg-surface text-text-main text-sm rounded-lg border border-border-subtle focus:border-primary focus:ring-1 focus:ring-primary outline-hidden disabled:bg-warm-bg/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div />
            {canEditSettings && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Institution Profile</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Tab 2: User Profile */}
      {activeTab === 'profile' && (
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-xs space-y-6">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-base font-bold text-text-main">
              Account Details
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Active session and storekeeper profile.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg border border-border-subtle shadow-xs">
              {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div>
              <h3 className="text-base font-bold text-text-main">
                {currentUser?.full_name || 'Hashim'}
              </h3>
              <p className="text-xs text-text-muted">{currentUser?.email || 'storekeeper@dhiu.in'}</p>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-border-subtle">
            <div>
              <dt className="text-text-muted font-medium">Account Status:</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-success font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active & Verified</span>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
