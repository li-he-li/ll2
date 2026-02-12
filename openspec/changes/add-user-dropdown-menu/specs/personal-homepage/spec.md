# Spec: Personal Homepage

## ADDED Requirements

### Requirement: Personal homepage page
The system MUST provide a personal homepage at `/profile` showing both published and purchased products.

#### Scenario: Access personal homepage
**Given** a user is logged in
**When** they navigate to `/profile`
**Then** the page loads successfully
**And** displays the user's avatar and name
**And** shows two tabs: "正在发布" and "已购入商品"
**And** the "正在发布" tab is active by default

#### Scenario: Redirect unauthenticated users
**Given** a user is not logged in
**When** they try to access `/profile`
**Then** they are redirected to `/dashboard`
**And** shown the login button

### Requirement: Published products tab
The personal homepage MUST display products the user has published that are still active.

#### Scenario: View published products
**Given** a user is on their personal homepage
**When** the "正在发布" tab is active
**Then** the page fetches products from `/api/products/mine`
**And** displays all active products published by the user
**And** uses the same product card design as the bargain hall
**And** shows an empty state if no products are published

#### Scenario: Published products loading state
**Given** the "正在发布" tab is loading
**When** the API call is in progress
**Then** a loading spinner is displayed
**And** the loading message says "加载商品中..."

#### Scenario: Published products empty state
**Given** the user has no active published products
**When** the "正在发布" tab loads
**Then** an empty state message is displayed
**And** the message says "还没有发布任何商品"
**And** a button to publish a product is shown

### Requirement: Purchased products tab
The personal homepage MUST display products the user has successfully bargained for (completed sessions).

#### Scenario: View purchased products
**Given** a user is on their personal homepage
**When** the "已购入商品" tab is active
**Then** the page fetches purchases from `/api/bargains/my-purchases`
**And** displays all completed bargain sessions where the user was the bargainer
**And** shows the final price paid for each product
**And** displays the completion date
**And** uses product cards similar to the bargain hall design

#### Scenario: Purchased products loading state
**Given** the "已购入商品" tab is loading
**When** the API call is in progress
**Then** a loading spinner is displayed
**And** the loading message says "加载购买记录中..."

#### Scenario: Purchased products empty state
**Given** the user has no purchased products
**When** the "已购入商品" tab loads
**Then** an empty state message is displayed
**And** the message says "还没有购买任何商品"
**And** a button to browse the bargain hall is shown

### Requirement: Tab switching
Users MUST be able to switch between the "正在发布" and "已购入商品" tabs on the personal homepage.

#### Scenario: Switch to purchased products tab
**Given** the "正在发布" tab is active
**When** the user clicks "已购入商品"
**Then** the "已购入商品" tab becomes active
**And** purchased products are loaded
**And** the tab indicator moves to the new tab

#### Scenario: Switch back to published products tab
**Given** the "已购入商品" tab is active
**When** the user clicks "正在发布"
**Then** the "正在发布" tab becomes active
**And** published products are displayed
**And** the tab indicator moves to the new tab

### Requirement: API endpoint for purchases
The system MUST provide an API endpoint at GET `/api/bargains/my-purchases` to fetch the user's successfully purchased products.

#### Scenario: Fetch my purchases
**Given** a user is authenticated with a valid session
**When** they call GET `/api/bargains/my-purchases`
**Then** the API returns completed bargain sessions where bargainerId matches the user
**And** each session includes the product details
**And** results are ordered by completion date (newest first)
**And** the response includes a `purchases` array

#### Scenario: Unauthorized access to purchases API
**Given** a user is not authenticated
**When** they call GET `/api/bargains/my-purchases`
**Then** the API returns 401 Unauthorized
**And** an error message is returned

### Requirement: User profile header
The personal homepage MUST display user information at the top including avatar, name, and statistics.

#### Scenario: View user profile header
**Given** a user is on their personal homepage
**When** viewing the header section
**Then** the user's avatar is displayed
**And** the user's name is shown
**And** statistics are displayed (number of published products, number of purchases)
**And** the header has a background color matching the app theme
