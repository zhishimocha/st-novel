'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { classNames } from '@/lib/utils';

const items = [
  { href: '/', label: '书架' },
  { href: '/calendar', label: '日历' },
  { href: '/highlights', label: '摘录' },
  { href: '/settings', label: '设置' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bottomNav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={classNames('navItem', pathname === item.href && 'navItemActive')}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
