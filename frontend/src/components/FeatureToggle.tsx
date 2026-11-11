import React, { ReactNode } from 'react';
import { useCountry } from '@/app/context/CountryContext';
import { useSettings } from '@/app/context/SettingsContext';

/**
 * FeatureToggle renders its children only when the given feature is enabled
 * for the current country (or falls back to the global setting).
 *
 * Example usage:
 *   <FeatureToggle feature="showCardUpload">
 *     <UploadCardComponent />
 *   </FeatureToggle>
 */
export const FeatureToggle = ({
  feature,
  children,
}: {
  feature: string;
  children: ReactNode;
}) => {
  const { country } = useCountry();
  const { getSetting } = useSettings();
  if (!country) return null; // still loading – render nothing
  const isEnabled = getSetting(feature, country.code);
  return isEnabled ? <>{children}</> : null;
};

