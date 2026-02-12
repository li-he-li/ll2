# Change: Add User Dropdown Menu

## Why

Currently, the dashboard shows a user button with a triangle (▼) icon, but it's not functional. Users need:
1. A way to access their personal homepage showing both published products AND purchased products
2. A logout option to switch accounts

The existing `/my-products` page only shows published products, not purchased ones. Users want a comprehensive view of all their marketplace activities.

## What Changes

- **Frontend:**
  - Create `UserDropdownMenu` component that shows when clicking the triangle next to user avatar
  - Add dropdown menu items: "个人主页" (Personal Homepage) and "退出登录" (Logout)
  - Create new `/profile` page showing:
    - Tab 1: "正在发布" (Currently Publishing) - user's published active products
    - Tab 2: "已购入商品" (Purchased Products) - products successfully bargained
  - Add click-outside-to-close functionality for the dropdown
  - Implement logout functionality that clears session and redirects to dashboard

- **Backend:**
  - Add GET `/api/bargains/my-purchases` endpoint to fetch completed bargain sessions
  - The endpoint returns products that user successfully bargained (status='completed' and bargainerId matches current user)

- **UI/UX:**
  - Dropdown menu positioned below the user button
  - Styled with primary colors matching the app theme
  - Hover effects on menu items
  - Smooth fade-in animation for dropdown appearance

## Impact

- Affected specs: `user-dropdown-menu` (new), `personal-homepage` (new)
- Affected code:
  - `components/UserDropdownMenu.tsx` - New dropdown menu component
  - `app/profile/page.tsx` - New personal homepage
  - `app/api/bargains/my-purchases/route.ts` - New API endpoint
  - `app/dashboard/page.tsx` - Integrate UserDropdownMenu component
  - `app/my-products/page.tsx` - Keep existing (alternative route for published-only view)

## Dependencies

- Existing `User` model in Prisma schema
- Existing `Product` and `BargainSession` models
- Existing `/api/auth/logout` endpoint (POST method)
- Existing `/api/auth/me` endpoint for user info
