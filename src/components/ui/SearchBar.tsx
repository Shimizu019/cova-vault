import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@lib/utils';
import { Search } from 'lucide-react';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  placeholder?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div className={cn('search-input-wrapper', className)}>
        <Search className="search-icon w-4 h-4" aria-hidden="true" />
        <input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
          {...props}
        />
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';