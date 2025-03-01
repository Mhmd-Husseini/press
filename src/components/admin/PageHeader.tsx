'use client';

import Link from 'next/link';
import PermissionGuard from '@/components/shared/PermissionGuard';

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonPermission?: string | string[];
  buttonAction?: () => void;
}

export default function PageHeader({
  title,
  description,
  buttonText,
  buttonHref,
  buttonPermission,
  buttonAction
}: PageHeaderProps) {
  const showButton = buttonText && (buttonHref || buttonAction);
  
  const button = (
    <button
      onClick={buttonAction}
      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {buttonText}
    </button>
  );
  
  const linkButton = (
    <Link
      href={buttonHref || '#'}
      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {buttonText}
    </Link>
  );

  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div className="mt-4 flex md:mt-0 md:ml-4">
        {showButton && buttonPermission ? (
          <PermissionGuard permissions={buttonPermission}>
            {buttonHref ? linkButton : button}
          </PermissionGuard>
        ) : (
          showButton && (buttonHref ? linkButton : button)
        )}
      </div>
    </div>
  );
} 