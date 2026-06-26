import React from 'react';
import { getStatusColor, getStatusLabel } from '../../utils/helpers';
import { useLanguage } from '../../hooks/useLanguage';
import { translateStatus } from '../../utils/i18n';

const StatusBadge = ({ status, localized = false }) => {
  const { t } = useLanguage();

  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${getStatusColor(status)}`}>
      {localized ? translateStatus(t, status) : getStatusLabel(status)}
    </span>
  );
};

export default StatusBadge;
