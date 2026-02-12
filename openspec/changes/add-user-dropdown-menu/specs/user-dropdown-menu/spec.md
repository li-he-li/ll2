# Spec: User Dropdown Menu

## ADDED Requirements

### Requirement: User dropdown menu display
The system MUST provide a clickable dropdown menu that appears when the user clicks the triangle icon or user button in the navigation bar.

#### Scenario: Open dropdown menu
**Given** a user is logged in
**When** they click the triangle (▼) icon next to their avatar
**Then** a dropdown menu appears below the button
**And** the menu contains two items: "🏠 个人主页" and "🚪 退出登录"

#### Scenario: Close dropdown by clicking outside
**Given** the dropdown menu is open
**When** the user clicks anywhere outside the dropdown
**Then** the dropdown menu closes

#### Scenario: Close dropdown by selecting an option
**Given** the dropdown menu is open
**When** the user clicks any menu item
**Then** the dropdown menu closes
**And** the selected action is executed

### Requirement: Personal homepage navigation
The dropdown menu MUST provide a link to the user's personal homepage at `/profile`.

#### Scenario: Navigate to personal homepage
**Given** the dropdown menu is open
**When** the user clicks "🏠 个人主页"
**Then** the user is redirected to `/profile`
**And** the dropdown menu closes

### Requirement: Logout functionality
The dropdown menu MUST provide a logout option that clears the user's session and allows login with a different account.

#### Scenario: Logout from dropdown
**Given** a user is logged in
**When** they click "🚪 退出登录" in the dropdown menu
**Then** the system calls POST `/api/auth/logout`
**And** the session cookie is deleted
**And** the user is redirected to `/dashboard`
**And** the "🔓 Dev Login" button is displayed

#### Scenario: Logout failure handling
**Given** the user clicks "🚪 退出登录"
**When** the logout API call fails
**Then** an error message is displayed to the user
**And** the user remains on the current page

### Requirement: Dropdown menu styling
The dropdown menu MUST match the app's visual design system with proper styling and hover effects.

#### Scenario: Verify dropdown styling
**Given** the dropdown menu is open
**When** viewing the menu
**Then** it has a white background with shadow
**Then** it has rounded corners
**And** menu items have padding for comfortable touch targets
**And** hovering over an item shows a background color change
**And** the menu is right-aligned with the user button

### Requirement: Keyboard accessibility
The dropdown menu MUST be accessible via keyboard navigation with proper focus management.

#### Scenario: Keyboard navigation
**Given** the dropdown menu is focused
**When** the user presses the Tab key
**Then** focus moves through menu items
**When** the user presses Escape
**Then** the dropdown menu closes
**When** the user presses Enter on a menu item
**Then** the item action is executed
