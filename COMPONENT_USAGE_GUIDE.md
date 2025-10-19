# Component Usage Guide

## Quick Reference for New UI Components

### 🎴 Card Component

```jsx
import Card from '../components/ui/Card';

// Basic usage
<Card>
  <Card.Header>
    <h3>Title</h3>
  </Card.Header>
  <Card.Body>
    Content here
  </Card.Body>
  <Card.Footer>
    Footer content
  </Card.Footer>
</Card>

// With variants
<Card variant="glass">Glass effect</Card>
<Card variant="gradient">Gradient background</Card>
<Card variant="elevated">Elevated shadow</Card>

// With hover effect
<Card hover className="cursor-pointer">
  Hover to see effect
</Card>
```

---

### 🔘 Button Component

```jsx
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="warning">Warning</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button icon={<Icon name="plus" />} iconPosition="left">
  Add Item
</Button>

// Loading state
<Button loading={true}>Loading...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

---

### 🏷️ Badge Component

```jsx
import Badge from '../components/ui/Badge';

// Variants
<Badge variant="default">Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="danger">Danger</Badge>
<Badge variant="warning">Warning</Badge>

// With dot indicator
<Badge variant="success" dot>Active</Badge>

// Sizes
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>
```

---

### 📊 StatCard Component

```jsx
import StatCard from '../components/ui/StatCard';
import Icon from '../components/ui/Icon';

// Basic stat card
<StatCard
  title="Total Sales"
  value="$1,234.56"
  subtitle="Last 30 days"
  icon={<Icon name="dollarSign" size="xl" />}
  variant="primary"
/>

// With trend indicator
<StatCard
  title="Revenue"
  value="$5,678"
  subtitle="vs last month"
  variant="success"
  trend={12} // 12% increase
/>

// Loading state
<StatCard loading={true} />
```

---

### 📝 Input Component

```jsx
import Input from '../components/ui/Input';
import Icon from '../components/ui/Icon';

// Basic input
<Input
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With icon
<Input
  label="Search"
  placeholder="Search..."
  icon={<Icon name="search" />}
  iconPosition="left"
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

---

### 📭 EmptyState Component

```jsx
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

<EmptyState
  icon="📋"
  title="No transactions found"
  description="Try adjusting your filters or add a new transaction"
  action={
    <Button variant="primary">
      Add Transaction
    </Button>
  }
/>
```

---

### ⏳ SkeletonLoader Component

```jsx
import SkeletonLoader from '../components/ui/SkeletonLoader';

// Default skeleton
<SkeletonLoader />

// Card skeleton
<SkeletonLoader variant="card" />

// Table row skeleton
<SkeletonLoader variant="table-row" />

// List item skeleton
<SkeletonLoader variant="list-item" />
```

---

### 🎨 Icon Component

```jsx
import Icon from '../components/ui/Icon';

// Available icons
<Icon name="users" size="md" />
<Icon name="dollarSign" size="lg" />
<Icon name="trendingUp" size="xl" />
<Icon name="creditCard" size="sm" />
<Icon name="shoppingCart" />
<Icon name="search" />
<Icon name="chartBar" />
<Icon name="plus" />
<Icon name="arrowRight" />
<Icon name="check" />

// Sizes: sm, md, lg, xl
```

---

## 🎯 Common Patterns

### Page Header
```jsx
<div className="flex justify-between items-center mb-6">
  <div>
    <h2 className="text-3xl font-bold text-gray-900">Page Title</h2>
    <p className="text-gray-600">Description</p>
  </div>
  <Button variant="primary" icon={<Icon name="plus" />}>
    Add New
  </Button>
</div>
```

### Stat Cards Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
    title="Metric 1"
    value="123"
    icon={<Icon name="users" size="xl" />}
    variant="primary"
  />
  <StatCard
    title="Metric 2"
    value="$456"
    icon={<Icon name="dollarSign" size="xl" />}
    variant="success"
  />
  {/* More cards... */}
</div>
```

### Search and Filters
```jsx
<Card>
  <Card.Body>
    <div className="flex gap-4">
      <Input
        placeholder="Search..."
        icon={<Icon name="search" />}
        iconPosition="left"
        className="flex-1"
      />
      <Button variant="primary">Filter</Button>
    </div>
  </Card.Body>
</Card>
```

### Responsive Table/Card View
```jsx
{/* Desktop: Table */}
<div className="hidden lg:block">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>

{/* Mobile: Cards */}
<div className="lg:hidden space-y-4">
  {items.map(item => (
    <Card key={item.id} hover>
      {/* Card content */}
    </Card>
  ))}
</div>
```

---

## 🎨 Animation Classes

### Entrance Animations
```jsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-up">Slides up</div>
<div className="animate-slide-down">Slides down</div>
<div className="animate-scale-in">Scales in</div>
```

### Animation Delays
```jsx
<div className="animate-slide-up animation-delay-100">Delayed 100ms</div>
<div className="animate-slide-up animation-delay-200">Delayed 200ms</div>
<div className="animate-slide-up animation-delay-300">Delayed 300ms</div>
```

### Special Effects
```jsx
<div className="glass">Glassmorphism effect</div>
<div className="shine">Shine effect on hover</div>
<div className="text-gradient">Gradient text</div>
<div className="custom-scrollbar">Custom scrollbar</div>
```

---

## 💡 Best Practices

1. **Always use components instead of recreating UI elements**
   - ✅ `<Button variant="primary">Click</Button>`
   - ❌ `<button className="bg-blue-500...">Click</button>`

2. **Use Icon component instead of emojis**
   - ✅ `<Icon name="users" />`
   - ❌ `👥`

3. **Apply hover effects for interactive elements**
   - ✅ `<Card hover className="cursor-pointer">`
   - ❌ `<div className="bg-white">`

4. **Use StatCard for metrics**
   - ✅ `<StatCard title="Total" value="123" />`
   - ❌ Custom div with styling

5. **Implement loading states**
   - ✅ `<SkeletonLoader variant="card" />`
   - ❌ No loading state

6. **Use EmptyState when no data**
   - ✅ `<EmptyState title="No data" action={<Button>Add</Button>} />`
   - ❌ `<p>No data found</p>`

7. **Add entrance animations**
   - ✅ `<div className="animate-fade-in">`
   - ❌ No animation

8. **Make responsive designs**
   - ✅ `<div className="hidden lg:block">Table</div><div className="lg:hidden">Cards</div>`
   - ❌ Table only

---

## 🚀 Quick Start Example

```jsx
import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Card, Button, StatCard, Input, Badge, Icon, EmptyState } from '../components/ui';

const MyPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Page</h2>
            <p className="text-gray-600">Page description</p>
          </div>
          <Button variant="primary" icon={<Icon name="plus" />}>
            Add New
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Items"
            value="123"
            icon={<Icon name="chartBar" size="xl" />}
            variant="primary"
            trend={5}
          />
        </div>

        {/* Search */}
        <Card>
          <Card.Body>
            <Input
              placeholder="Search..."
              icon={<Icon name="search" />}
              iconPosition="left"
            />
          </Card.Body>
        </Card>

        {/* Content */}
        <Card>
          {data.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No items yet"
              description="Add your first item to get started"
              action={<Button>Add Item</Button>}
            />
          ) : (
            <Card.Body>
              {/* Your content here */}
            </Card.Body>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};

export default MyPage;
```

---

**Remember**: All components are fully typed, accessible, and follow modern React best practices!
