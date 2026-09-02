import { useState, useRef, useEffect, ReactNode, Fragment } from 'react';
import { cn } from '@lib/utils';
import { createPortal } from 'react-dom';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) { item.onClick(); setIsOpen(false); }
  };

  const content = isOpen ? (
    <div
      ref={dropdownRef}
      className={cn('dropdown animate-scale-in', align === 'right' ? 'right-0' : 'left-0')}
      role="menu"
    >
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={cn(
            'dropdown-item w-full text-left',
            item.danger && 'dropdown-item-danger',
            item.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  ) : null;

  return (
    <Fragment>
      <span ref={triggerRef} onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </span>
      {typeof window !== 'undefined' && content && createPortal(content, document.body)}
    </Fragment>
  );
}