import React from 'react';

interface SubmissionsHeaderProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function SubmissionsHeader({
  title = 'Bài được giao',
}: SubmissionsHeaderProps) {
  return (
    <div className="pb-4">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 tracking-tight">
        {title}
      </h1>
    </div>
  );
}
