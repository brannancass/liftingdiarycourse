# UI Coding Standards

This document outlines the UI coding standards and guidelines for this project.

## Component Library

**ONLY shadcn/ui components should be used for all UI elements in this project.**

### Key Rules

- ✅ **Use shadcn/ui components exclusively** - All UI components must come from the shadcn/ui library
- ❌ **NO custom components** - Absolutely no custom UI components should be created
- ✅ **Leverage shadcn/ui variants** - Use the built-in variants, sizes, and styling options provided by shadcn/ui
- ✅ **Compose existing components** - Combine shadcn/ui components to create complex layouts and interactions

### Installation & Usage

Components should be installed via the shadcn/ui CLI:

```bash
npx shadcn@latest add [component-name]
```

Import and use components from the `@/components/ui` directory:

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

## Date Formatting

All date formatting must be handled using the **date-fns** library.

### Required Date Format

Dates should be displayed in the following format:
- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jan 2024`

### Implementation

```tsx
import { format } from "date-fns"

// Format function for consistent date display
const formatDate = (date: Date): string => {
  return format(date, "do MMM yyyy")
}

// Usage example
const displayDate = formatDate(new Date()) // "23rd Feb 2026"
```

### Date Utilities

Use date-fns functions for all date operations:
- `format()` for formatting dates
- `parseISO()` for parsing ISO date strings
- `isAfter()`, `isBefore()` for date comparisons
- `addDays()`, `subDays()` for date arithmetic

## Styling Guidelines

### Tailwind CSS

- Use Tailwind CSS classes for styling shadcn/ui components
- Follow the project's design system variables defined in `app/globals.css`
- Utilize CSS custom properties `--background` and `--foreground` for consistent theming

### Component Composition

When building complex UI sections:

1. **Start with shadcn/ui components** as the foundation
2. **Compose components together** using proper layout components (Card, Sheet, Dialog, etc.)
3. **Apply Tailwind classes** for spacing, positioning, and visual styling
4. **Use shadcn/ui variants** (size, variant, etc.) before custom styling

## Examples

### Good ✅

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

export function ExerciseCard({ exercise, date }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(date, "do MMM yyyy")}
        </p>
      </CardHeader>
      <CardContent>
        <Button variant="outline">Edit Exercise</Button>
      </CardContent>
    </Card>
  )
}
```

### Bad ❌

```tsx
// Custom components are forbidden
const CustomButton = ({ children }: Props) => {
  return <button className="custom-button">{children}</button>
}

// Custom date formatting is forbidden
const customDateFormat = (date: Date) => {
  return date.toLocaleDateString() // Wrong format
}
```

## Component Categories

### Available shadcn/ui Components

Refer to [shadcn/ui documentation](https://ui.shadcn.com/docs/components) for the complete list of available components including:

- **Layout**: Card, Separator, Aspect Ratio
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Forms**: Button, Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Data Display**: Table, Badge, Avatar, Progress, Calendar
- **Feedback**: Alert, Toast, Dialog, Alert Dialog, Popover, Tooltip
- **Overlay**: Sheet, Drawer, Hover Card, Context Menu, Dropdown Menu

## Enforcement

These standards are **mandatory** for all UI development in this project. Code reviews should verify:

1. No custom UI components are introduced
2. Only shadcn/ui components are used
3. Date formatting follows the specified format using date-fns
4. Proper component composition patterns are followed