import { PasswordGenerator } from '@components/PasswordGenerator';
import { PageHeader } from '@components/ui/PageHeader';
import { Card, CardContent } from '@components/ui/Card';
import { Key } from 'lucide-react';

export function PasswordGeneratorPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Password Generator"
        subtitle="Generate strong, secure passwords"
      />

      <Card>
        <CardContent className="p-6">
          <PasswordGenerator />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-3">Tips for Strong Passwords</h3>
          <ul className="space-y-2 text-sm text-light-textSecondary dark:text-dark-textSecondary">
            <li className="flex items-center gap-2"><Key className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted flex-shrink-0" /> Use at least 16 characters</li>
            <li className="flex items-center gap-2"><Key className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted flex-shrink-0" /> Mix uppercase, lowercase, numbers, and symbols</li>
            <li className="flex items-center gap-2"><Key className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted flex-shrink-0" /> Avoid dictionary words and personal information</li>
            <li className="flex items-center gap-2"><Key className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted flex-shrink-0" /> Use unique passwords for each account</li>
            <li className="flex items-center gap-2"><Key className="w-4 h-4 text-light-textMuted dark:text-dark-textMuted flex-shrink-0" /> Store passwords securely in your vault</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}