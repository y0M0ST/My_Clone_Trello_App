import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { PageLoader } from './Loader';

interface LazyLoadProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export const LazyLoad = ({ fallback = <PageLoader />, children }: LazyLoadProps) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};
