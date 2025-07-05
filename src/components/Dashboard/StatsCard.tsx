import React, { ReactNode } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

export function StatsCard({ title, value, change, changeType, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className={`text-sm mt-2 ${changeColorClasses[changeType]}`}>
            {change}
          </p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}