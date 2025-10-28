# Countdown Component

A reusable countdown timer component that displays time in MM:SS format with an optional spinner loader. Supports both duration-based and date-based countdowns using `date-fns`.

## Features

- ⏰ **MM:SS Format** - Displays time in minutes:seconds format
- 📅 **Date-based Countdown** - Countdown to specific future dates/times
- ⏱️ **Duration-based Countdown** - Simple countdown from a fixed duration
- 🔄 **Spinner Loader** - Optional loading spinner while countdown is active
- 🎨 **Customizable** - Text size, color, and styling options
- ⚡ **Performance** - Optimized with proper cleanup and state management
- 📱 **Responsive** - Works on all screen sizes
- 🌙 **Dark Mode** - Supports dark/light theme
- 🚫 **Expired State** - Handles past target dates gracefully

## Usage

### Duration-based Countdown

```tsx
import { Countdown } from '@/components/ui/countdown';

function MyComponent() {
  const handleComplete = () => {
    console.log('Countdown finished!');
  };

  return (
    <Countdown
      duration={300} // 5 minutes
      onComplete={handleComplete}
    />
  );
}
```

### Date-based Countdown

```tsx
import { Countdown } from '@/components/ui/countdown';
import { addMinutes } from 'date-fns';

function EventCountdown() {
  const eventDate = addMinutes(new Date(), 30); // 30 minutes from now

  return (
    <Countdown
      targetDate={eventDate}
      onComplete={() => {
        console.log('Event started!');
      }}
      completedText="Event has started!"
      expiredText="Event has already started"
    />
  );
}
```

### Advanced Usage

```tsx
import { Countdown } from '@/components/ui/countdown';

function PaymentTimer() {
  const [isActive, setIsActive] = useState(true);

  return (
    <Countdown
      duration={600} // 10 minutes
      onComplete={() => {
        // Handle payment timeout
        setIsActive(false);
      }}
      showSpinner={true}
      textSize="2xl"
      textColor="text-red-600 dark:text-red-400"
      isActive={isActive}
      className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg"
      completedText="Payment expired!"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | `number` | `undefined` | Duration in seconds (for simple countdown) |
| `targetDate` | `Date` | `undefined` | Target date/time to countdown to (alternative to duration) |
| `onComplete` | `() => void` | `undefined` | Callback when countdown reaches zero |
| `showSpinner` | `boolean` | `true` | Whether to show the spinner loader |
| `textSize` | `string` | `'lg'` | Text size: 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl' |
| `textColor` | `string` | `'text-gray-900 dark:text-gray-100'` | Custom text color classes |
| `isActive` | `boolean` | `true` | Whether the countdown is active |
| `className` | `string` | `''` | Custom CSS classes for the container |
| `completedText` | `string` | `"Time's up!"` | Text to show when countdown is completed |
| `expiredText` | `string` | `"Expired"` | Text to show when target date is in the past |

## Examples

### Event Countdown

```tsx
<Countdown
  targetDate={new Date('2024-12-31T23:59:59')} // New Year's Eve
  onComplete={() => {
    // Celebrate!
    showFireworks();
  }}
  textSize="xl"
  textColor="text-green-600 dark:text-green-400"
  className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
  completedText="Happy New Year!"
  expiredText="Event has passed"
/>
```

### Session Timer

```tsx
<Countdown
  duration={1800} // 30 minutes
  onComplete={() => {
    // Logout user
    logout();
  }}
  showSpinner={false}
  textSize="lg"
  textColor="text-blue-600 dark:text-blue-400"
/>
```

### Quiz Timer

```tsx
<Countdown
  duration={1200} // 20 minutes
  onComplete={() => {
    // Auto-submit quiz
    submitQuiz();
  }}
  textSize="3xl"
  textColor="text-purple-600 dark:text-purple-400"
  className="border-2 border-purple-200 dark:border-purple-800 p-4 rounded-xl"
/>
```

## Styling

The component uses Tailwind CSS classes and supports:

- **Text Sizes**: `text-xs` to `text-6xl`
- **Colors**: Any Tailwind color classes
- **Dark Mode**: Automatic dark mode support
- **Custom Classes**: Additional styling via `className` prop

## Performance

- ✅ **Memory Efficient** - Proper cleanup of intervals
- ✅ **Re-render Optimized** - Minimal state updates
- ✅ **Dependency Tracking** - Only recalculates when needed
- ✅ **Cleanup** - Automatic timer cleanup on unmount

## Accessibility

- ✅ **Screen Reader Friendly** - Proper text content
- ✅ **High Contrast** - Supports custom colors
- ✅ **Responsive** - Works on all device sizes

## Dependencies

- `@/components/ui/spinner` - Loading spinner component
- `@/components/ui/text` - Text component
- `@/components/ui/view` - View container
- `@/components/ui/vstack` - Vertical stack layout
- `date-fns` - Date manipulation library for date-based countdowns

## File Structure

```
components/ui/countdown/
├── countdown.tsx          # Main component
├── countdown-example.tsx  # Usage example
├── index.ts              # Exports
└── README.md             # Documentation
```
