'use client';

import React from 'react';
import Link from 'next/link';
import PermissionGuard from '@/components/shared/PermissionGuard';

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  permission?: string | string[];
}

interface PageHeaderProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonPermission?: string | string[];
  buttonAction?: () => void;
  actions?: Action[];
}

export default function PageHeader({
  title,
  description,
  buttonText,
  buttonHref,
  buttonPermission,
  buttonAction,
  actions
}: PageHeaderProps) {
  const showButton = buttonText && (buttonHref || buttonAction);
  
  const getButtonClass = (variant?: string) => {
    const baseClass = "ml-3 inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (variant) {
      case 'secondary':
        return `${baseClass} border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500`;
      case 'danger':
        return `${baseClass} border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      case 'primary':
      default:
        return `${baseClass} border-transparent bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500`;
    }
  };
  
  const button = (
    <button
      onClick={buttonAction}
      className={getButtonClass()}
    >
      {buttonText}
    </button>
  );
  
  const linkButton = (
    <Link
      href={buttonHref || '#'}
      className={getButtonClass()}
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
        {/* Legacy button support */}
        {showButton && buttonPermission ? (
          <PermissionGuard permissions={buttonPermission}>
            {buttonHref ? linkButton : button}
          </PermissionGuard>
        ) : (
          showButton && (buttonHref ? linkButton : button)
        )}
        
        {/* Actions array support */}
        {actions && actions.map((action, index) => {
          const actionButton = (
            <React.Fragment key={index}>
              {action.href ? (
                <Link
                  href={action.href}
                  className={getButtonClass(action.variant)}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Link>
              ) : (
                <button
                  onClick={action.onClick}
                  className={getButtonClass(action.variant)}
                >
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </button>
              )}
            </React.Fragment>
          );
          
          return action.permission ? (
            <PermissionGuard key={index} permissions={action.permission}>
              {actionButton}
            </PermissionGuard>
          ) : actionButton;
        })}
      </div>
    </div>
  );
} 