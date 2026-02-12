# Tasks: Add User Dropdown Menu

## Task 1: Create UserDropdownMenu component
Create a reusable dropdown menu component that can be integrated into the navigation bar.

- [x] Create `components/UserDropdownMenu.tsx`
  - Add props interface for user data
  - Implement state for dropdown open/close
  - Add click-outside-to-close functionality using useEffect and event listeners
  - Render dropdown button with user avatar and triangle icon
  - Render dropdown menu with two options (Personal Homepage, Logout)
  - Apply Tailwind classes for styling (shadow, rounded corners, hover effects)
  - Add animation for fade-in effect
- [x] Add keyboard accessibility (Escape to close, Enter to select)
- [x] Test dropdown opens/closes correctly

## Task 2: Create my-purchases API endpoint
Create a backend API endpoint to fetch the user's completed bargain sessions.

- [x] Create `app/api/bargains/my-purchases/route.ts`
  - Implement GET handler
  - Extract userId from secondme_session cookie
  - Query database for BargainSession where bargainerId matches user and status='completed'
  - Include related Product data in the response
  - Order results by completedAt DESC
  - Return formatted JSON response with purchases array
  - Handle authentication errors (401 if no session)
  - Handle database errors gracefully
- [x] Test endpoint with curl or Postman

## Task 3: Create personal homepage page
Create the `/profile` page that shows both published and purchased products.

- [x] Create `app/profile/page.tsx`
  - Add authentication check (redirect to /dashboard if not logged in)
  - Create user state and loading states
  - Implement tab state for switching between "正在发布" and "已购入商品"
  - Add user profile header section (avatar, name, stats)
  - Implement tab switcher component
  - Integrate ProductList component for published products
  - Create PurchasedProductList component for purchased products
  - Add loading states for each tab
  - Add empty state messages with appropriate actions
- [x] Test page loads correctly for authenticated users
- [x] Test redirect for unauthenticated users

## Task 4: Create PurchasedProductList component
Create a component to display the user's purchased products.

- [x] Create `components/PurchasedProductList.tsx`
  - Add props interface
  - Implement useState for products and loading
  - Fetch data from `/api/bargains/my-purchases`
  - Display products in a grid layout (same as ProductList)
  - Show product card with: image, title, final price, completion date
  - Add loading spinner
  - Add empty state with link to bargain hall
- [x] Test component displays purchased products correctly

## Task 5: Integrate UserDropdownMenu into dashboard
Replace the existing user button in the dashboard with the new dropdown component.

- [x] Edit `app/dashboard/page.tsx`
  - Import UserDropdownMenu component
  - Replace the user button (lines 134-143) with UserDropdownMenu component
  - Pass user data as props
  - Remove the inline triangle icon (now part of component)
- [x] Test dropdown appears when clicking user button
- [x] Test menu items work correctly

## Task 6: Implement logout functionality
Connect the logout button in the dropdown to the logout API and handle redirect.

- [x] Edit `components/UserDropdownMenu.tsx`
  - Add handleLogout function
  - Call POST `/api/auth/logout`
  - On success, redirect to `/dashboard`
  - On error, show error message
- [x] Test logout redirects to dashboard
- [x] Test login button appears after logout

## Task 7: Add navigation to personal homepage
Connect the "个人主页" menu item to navigate to the profile page.

- [x] Edit `components/UserDropdownMenu.tsx`
  - Use Next.js Link component or useRouter for navigation
  - Navigate to `/profile` when clicking "🏠 个人主页"
  - Close dropdown after navigation
- [x] Test navigation works correctly

## Task 8: Style the personal homepage
Apply consistent styling to match the app's design system.

- [x] Add styling to user profile header
  - Background color, padding, border radius
  - Avatar styling (size, rounded)
  - Stats display (published count, purchased count)
- [x] Style tab switcher
  - Active tab indicator (primary color background)
  - Inactive tab styling
  - Hover effects
  - Smooth transition between tabs
- [x] Ensure responsive design works on mobile

## Task 9: Test end-to-end user flows
Verify the complete user journey works as expected.

- [x] Test flow: Login → Click dropdown → View personal homepage → See published products
- [x] Test flow: Login → Click dropdown → View personal homepage → Switch to purchased tab → See purchased products
- [x] Test flow: Login → Click dropdown → Logout → Verify login button appears
- [x] Test flow: Login → Click dropdown → Click outside → Verify dropdown closes
- [x] Test flow: Unauthenticated user tries to access `/profile` → Verify redirect to dashboard
- [x] Test keyboard navigation (Tab, Enter, Escape)

## Task 10: Error handling and edge cases
Ensure robust error handling throughout the feature.

- [x] Add error handling for failed API calls in PurchasedProductList
- [x] Add error handling for logout failures
- [x] Add error handling for authentication failures in personal homepage
- [x] Test with no published products (empty state)
- [x] Test with no purchased products (empty state)
- [x] Test with slow network (loading states)
