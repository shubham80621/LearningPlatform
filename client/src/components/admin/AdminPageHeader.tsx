import { useLayoutEffect } from 'react';
import { useAdminHeader } from '../../contexts/AdminHeaderContext';

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
};

/** Syncs page title + subtitle into the sticky admin top bar. */
export default function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  const { setHeader, clearHeader } = useAdminHeader();

  useLayoutEffect(() => {
    setHeader({
      title,
      subtitle,
      breadcrumbs: [],
      actions: null,
    });

    return () => {
      clearHeader();
    };
  }, [title, subtitle, setHeader, clearHeader]);

  return null;
}
