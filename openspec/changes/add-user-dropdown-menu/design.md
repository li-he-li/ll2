# Design: User Dropdown Menu

## Overview

This design implements a dropdown menu accessible from the user avatar button in the navigation bar. The menu provides quick access to user-specific features and account management.

## Component Architecture

```
dashboard (page)
  └── header
       └── UserDropdownMenu (new component)
            ├── DropdownButton (toggle)
            ├── DropdownMenu (conditional render)
            │    ├── PersonalHomepageLink
            │    └── LogoutButton
            └── (click-outside handler)
```

## User Flow

### Dropdown Menu Interaction
1. User clicks the triangle (▼) or the entire user button in the navigation bar
2. Dropdown menu appears with two options:
   - "🏠 个人主页" - Navigates to `/profile`
   - "🚪 退出登录" - Logs out and redirects to `/dashboard`
3. Clicking outside the dropdown closes it
4. Selecting an option closes the dropdown and performs the action

### Logout Flow
1. User clicks "退出登录" in the dropdown
2. Frontend calls POST `/api/auth/logout`
3. Backend deletes the `secondme_session` cookie
4. Frontend redirects to `/dashboard` with the login button showing

### Personal Homepage Flow
1. User clicks "个人主页" in the dropdown
2. Navigate to `/profile` page
3. Page loads user's published products (from `/api/products/mine`)
4. Page loads user's purchased products (from `/api/bargains/my-purchases`)
5. Display two tabs:
   - "正在发布" (Publishing) - shows active Product records
   - "已购入" (Purchased) - shows completed BargainSession records

## API Design

### GET /api/bargains/my-purchases

**Authentication**: Requires `secondme_session` cookie

**Response** (200 OK):
```json
{
  "purchases": [
    {
      "id": "bargain_session_id",
      "productId": "product_id",
      "product": {
        "id": "product_id",
        "title": "商品标题",
        "imageUrl": "https://...",
        "publishPrice": 9999
      },
      "finalPrice": 8999,
      "completedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Query Logic**:
```sql
SELECT bs.*, p.* FROM bargain_sessions bs
JOIN products p ON bs.productId = p.id
WHERE bs.bargainerId = {userId}
  AND bs.status = 'completed'
ORDER BY bs.completedAt DESC
```

## UI Design

### Dropdown Menu Styles
- **Position**: Absolute positioned below the user button, right-aligned
- **Background**: White (`bg-bg-card`) with shadow (`shadow-card`)
- **Border Radius**: Rounded corners (`rounded-xl`)
- **Animation**: Fade in with slight slide down
- **Items**:
  - Padding: `px-4 py-3`
  - Hover: `bg-primary-bg` background
  - Text: `text-text-primary` with `text-sm font-semibold`
  - Flex layout with icon + text
  - Gap between icon and text: `gap-2`

### Personal Homepage Layout
- **Header**: User info card with avatar, name, stats
- **Tabs**: Tab switcher between "正在发布" and "已购入"
- **Product Grid**: Same 2×4 responsive grid as dashboard
- **Empty States**: Friendly messages when no products in each category

## State Management

### Dropdown State
```typescript
const [isOpen, setIsOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### Tab State (Personal Homepage)
```typescript
const [activeTab, setActiveTab] = useState<'publishing' | 'purchased'>('publishing');
```

## Error Handling

- **Logout failure**: Show error toast, remain on current page
- **API failures**: Show error message in the respective tab
- **Session expired**: Redirect to `/dashboard` with login prompt

## Accessibility

- Keyboard navigation (Escape to close, Enter to select)
- ARIA attributes for screen readers
- Focus management when dropdown opens/closes
