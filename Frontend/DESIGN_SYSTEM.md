# VTS Modern Dashboard Design System

## Overview

This design system provides a comprehensive set of components and styling for creating modern, professional SaaS dashboard interfaces with a blue and silver color scheme. The system is optimized for roles including Company Admin, Operations Manager, Booking Office, and Driver.

## 🎨 Design Principles

### Color Scheme
- **Primary Blue**: Professional blue tones (#0c8ce9) for primary actions and highlights
- **Silver/Gray**: Elegant gray palette for backgrounds, borders, and secondary elements
- **Semantic Colors**: Success (green), warning (amber), error (red), info (blue)

### Typography
- **Font Family**: Inter (with system font fallbacks)
- **Hierarchy**: Clear typographic scale from 12px to 32px
- **Weight**: Normal (400), Medium (500), Semibold (600), Bold (700)

### Spacing & Layout
- **Grid System**: 8px base unit with responsive breakpoints
- **Border Radius**: 6px (small), 8px (medium), 12px (large), 16px (extra large)
- **Shadows**: Subtle elevation system with 4 levels
- **Transitions**: Fast (150ms), Normal (300ms), Slow (500ms)

## 🏗️ Core Components

### 1. Theme System (`src/styles/theme.js`)

Central theme configuration with:
- Color palettes
- Typography scales
- Spacing units
- Shadow definitions
- Border radius values
- Transition timings

```javascript
import theme from '../../styles/theme';

// Access theme values
const primaryColor = theme.colors.primary[500];
const mediumSpacing = theme.spacing.md;
const borderRadius = theme.borderRadius.md;
```

### 2. SidebarLayout (`src/components/layout/SidebarLayout.jsx`)

Modern collapsible sidebar with:
- **Responsive Design**: Auto-collapse on tablets, mobile drawer on phones
- **Smooth Animations**: Transitions between collapsed/expanded states
- **User Information**: Avatar, name, email, and role badge
- **Icon System**: Consistent iconography for all navigation items
- **Branch Selector**: Special selector for Booking Office users

#### Features:
- Collapsible navigation (280px → 72px)
- User profile section with avatar and role
- Branch selection for scoped access
- Profile menu with logout
- Notification badge
- Mobile-responsive drawer

#### Usage:
```jsx
<SidebarLayout title="Dashboard" navItems={navigationItems}>
  {/* Dashboard content */}
</SidebarLayout>
```

### 3. DashboardCard (`src/components/common/DashboardCard.jsx`)

Flexible card component with variants:

#### Basic Card
```jsx
<DashboardCard 
  title="Card Title"
  subtitle="Card description"
  icon="dashboard"
  variant="outlined"
>
  Card content here
</DashboardCard>
```

#### Stats Card
```jsx
<StatsCard
  title="Total Users"
  value="1,247"
  icon="users"
  trend={{ direction: 'up', value: '+12%' }}
  color="primary"
/>
```

#### Alert Card
```jsx
<AlertCard
  type="warning"
  title="System Maintenance"
  message="Scheduled maintenance tonight at 2:00 AM"
  action={<Button>View Details</Button>}
/>
```

#### Quick Actions Card
```jsx
<QuickActionCard
  title="Quick Actions"
  actions={[
    { label: 'New Trip', icon: 'add', onClick: handleNewTrip },
    { label: 'Reports', icon: 'reports', onClick: handleReports },
  ]}
/>
```

### 4. DataTable (`src/components/common/DataTable.jsx`)

Comprehensive data table with:
- **Search and Filter**: Built-in search functionality
- **Sorting**: Column-based sorting with visual indicators
- **Selection**: Single/multi-row selection with checkboxes
- **Pagination**: Configurable page sizes
- **Actions**: Table-level and row-level actions
- **Loading States**: Skeleton loading placeholders
- **Empty States**: Custom empty state messaging

#### Usage:
```jsx
<DataTable
  title="User Management"
  data={userData}
  columns={[
    { field: 'name', headerName: 'Name', sortable: true },
    { field: 'email', headerName: 'Email', sortable: true },
    { field: 'status', headerName: 'Status', type: 'status' },
  ]}
  actions={[
    { label: 'Add User', icon: 'add', onClick: handleAdd },
  ]}
  rowActions={[
    { label: 'Edit', icon: 'edit', onClick: handleEdit },
    { label: 'Delete', icon: 'delete', onClick: handleDelete },
  ]}
  selectable
  searchable
  pagination
/>
```

### 5. Form Components (`src/components/common/FormComponents.jsx`)

Modern form controls with consistent styling:

#### Text Fields
```jsx
<ModernTextField
  label="Full Name"
  placeholder="Enter full name"
  fullWidth
/>

<SearchField
  placeholder="Search users..."
  value={searchTerm}
  onChange={handleSearch}
  onClear={handleClear}
/>

<PasswordField
  label="Password"
  placeholder="Enter password"
/>
```

#### Select Components
```jsx
<ModernSelect
  label="Role"
  value={selectedRole}
  onChange={handleRoleChange}
  options={[
    { value: 'admin', label: 'Administrator', icon: 'admin' },
    { value: 'driver', label: 'Driver', icon: 'driver' },
  ]}
/>

<ChipSelect
  label="Tags"
  value={selectedTags}
  onChange={handleTagsChange}
  options={tagOptions}
/>
```

#### Buttons
```jsx
<ModernButton
  variant="contained"
  icon="save"
  onClick={handleSave}
>
  Save Changes
</ModernButton>
```

#### Form Layout
```jsx
<FormSection title="User Details" subtitle="Basic information">
  <FormRow>
    <ModernTextField label="First Name" />
    <ModernTextField label="Last Name" />
  </FormRow>
  <FormRow>
    <ModernTextField label="Email" fullWidth />
  </FormRow>
</FormSection>
```

### 6. Grid System (`src/components/common/DashboardGrid.jsx`)

Responsive layout system:

```jsx
<DashboardGrid spacing={3}>
  <GridItem xs={12} md={8}>
    <DataTable {...tableProps} />
  </GridItem>
  <GridItem xs={12} md={4}>
    <DashboardCard {...cardProps} />
  </GridItem>
</DashboardGrid>
```

#### Layout Presets
```javascript
// Use predefined layouts
const { overview, management, analytics } = DashboardLayout;

<GridItem {...overview.statsRow}>
  <StatsCard />
</GridItem>
```

### 7. Icon System (`src/components/common/IconMap.jsx`)

Comprehensive icon mapping with role-based navigation:

```jsx
// Use the Icon component
<Icon name="dashboard" size={24} color={theme.colors.primary[500]} />

// Role-based navigation
const { roleNavigation } = require('./IconMap');
const adminNavigation = roleNavigation.admin;
```

## 📱 Responsive Design

### Breakpoints
- **xs**: 0px - 600px (Mobile)
- **sm**: 600px - 960px (Tablet)
- **md**: 960px - 1280px (Desktop)
- **lg**: 1280px - 1920px (Large Desktop)
- **xl**: 1920px+ (Extra Large)

### Responsive Features
- **Sidebar**: Auto-collapse on tablets, drawer on mobile
- **Grid**: Responsive column counts and spacing
- **Typography**: Scalable font sizes
- **Touch Targets**: 44px minimum for mobile interactions

## 🎭 Animation System

### Predefined Animations
```css
.fade-in { animation: fadeIn 0.3s ease-in-out; }
.slide-in-left { animation: slideInLeft 0.3s ease-out; }
.scale-in { animation: scaleIn 0.2s ease-out; }
```

### Transition Guidelines
- **Fast (150ms)**: Hover states, button interactions
- **Normal (300ms)**: Component state changes, sidebar collapse
- **Slow (500ms)**: Page transitions, complex animations

## 🔧 Implementation Guide

### 1. Setup Theme
```jsx
// In your main App component
import theme from './styles/theme';
import './styles/globalStyles.css';
```

### 2. Create Dashboard Layout
```jsx
import SidebarLayout from './components/layout/SidebarLayout';
import { roleNavigation } from './components/common/IconMap';

function Dashboard() {
  const role = getUserRole();
  const navItems = roleNavigation[role];
  
  return (
    <SidebarLayout title="Dashboard" navItems={navItems}>
      {/* Dashboard content */}
    </SidebarLayout>
  );
}
```

### 3. Build Content Areas
```jsx
import { DashboardGrid, GridItem } from './components/common/DashboardGrid';
import DashboardCard from './components/common/DashboardCard';

function DashboardContent() {
  return (
    <DashboardGrid>
      <GridItem xs={12} md={8}>
        <DashboardCard title="Main Content">
          {/* Content */}
        </DashboardCard>
      </GridItem>
      <GridItem xs={12} md={4}>
        <DashboardCard title="Sidebar">
          {/* Sidebar content */}
        </DashboardCard>
      </GridItem>
    </DashboardGrid>
  );
}
```

## 🎯 Role-Specific Customization

### Dashboard Layouts by Role

#### Company Admin
- Full system access
- Comprehensive navigation (18 items)
- Management-focused layout
- Financial and operational metrics

#### Operations Manager
- Operational focus
- Fleet and staff management
- Scheduling and coordination tools
- Performance analytics

#### Booking Office
- Customer-facing operations
- Branch-scoped data access
- Ticketing and reservation tools
- Branch selector in header

#### Driver
- Trip-focused interface
- Personal performance metrics
- Communication tools
- Document management

## 🚀 Performance Considerations

### Optimization Strategies
- **Lazy Loading**: Components load on demand
- **Memoization**: Prevent unnecessary re-renders
- **Virtual Scrolling**: For large data tables
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Splitting**: Separate chunks for different roles

### Best Practices
1. Use `React.memo()` for expensive components
2. Implement proper loading states
3. Optimize icon usage with consistent sizing
4. Use CSS-in-JS efficiently with theme values
5. Implement proper error boundaries

## 🧪 Testing Integration

### Component Testing
```jsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../styles/theme';
import DashboardCard from '../components/common/DashboardCard';

function renderWithTheme(component) {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
}
```

### Accessibility Testing
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## 📈 Future Enhancements

### Planned Features
1. **Dark Mode**: Toggle between light and dark themes
2. **Customization**: User-configurable color schemes
3. **Advanced Charts**: Interactive data visualization
4. **Real-time Updates**: Live data streaming
5. **Mobile App**: React Native implementation

### Migration Path
The design system is built to be backwards compatible with existing components while providing a clear upgrade path for enhanced functionality.

---

For examples and live demonstrations, see the `ModernDashboardExample` component in `/src/components/examples/`.
