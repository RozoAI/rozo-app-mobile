import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { differenceInSeconds, isBefore } from 'date-fns';
import React, { useCallback, useEffect, useState } from 'react';

export interface CountdownProps {
  /**
   * Duration in seconds (for simple countdown)
   */
  duration?: number;
  /**
   * Target date/time to countdown to (alternative to duration)
   */
  targetDate?: Date;
  /**
   * Callback when countdown reaches zero
   */
  onComplete?: () => void;
  /**
   * Whether to show the spinner loader
   */
  showSpinner?: boolean;
  /**
   * Custom text size for the countdown display
   */
  textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  /**
   * Custom text color for the countdown display
   */
  textColor?: string;
  /**
   * Whether the countdown is active
   */
  isActive?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Text to show when countdown is completed
   */
  completedText?: string;
  /**
   * Text to show when target date is in the past
   */
  expiredText?: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  duration,
  targetDate,
  onComplete,
  showSpinner = true,
  textSize = 'lg',
  textColor = 'text-gray-900 dark:text-gray-100',
  isActive = true,
  className = '',
  completedText = "Time's up!",
  expiredText = "Expired",
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Calculate initial time left
  const calculateTimeLeft = useCallback((): number => {
    if (targetDate) {
      const now = new Date();
      if (isBefore(targetDate, now)) {
        setIsExpired(true);
        return 0;
      }
      return differenceInSeconds(targetDate, now);
    }
    return duration || 0;
  }, [targetDate, duration]);

  useEffect(() => {
    if (!isActive || isCompleted || isExpired) return;

    const timer = setInterval(() => {
      if (targetDate) {
        // For date-based countdown, recalculate each time
        const now = new Date();
        if (isBefore(targetDate, now)) {
          setIsExpired(true);
          setIsCompleted(true);
          onComplete?.();
          return;
        }
        const remaining = differenceInSeconds(targetDate, now);
        setTimeLeft(remaining);
      } else {
        // For duration-based countdown, decrement
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isCompleted, isExpired, onComplete, targetDate]);

  // Initialize time left
  useEffect(() => {
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);
    setIsCompleted(false);
    setIsExpired(false);
  }, [duration, targetDate, calculateTimeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTextSizeClass = (size: string): string => {
    const sizeMap: Record<string, string> = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    };
    return sizeMap[size] || 'text-lg';
  };

  return (
    <View className={`flex flex-row gap-2 items-center justify-center ${className}`}>
      {showSpinner && !isCompleted && !isExpired && (
          <Spinner size="small" />
        )}
        
        <Text 
          className={`font-mono font-semibold ${getTextSizeClass(textSize)} ${textColor}`}
        >
          {isExpired ? expiredText : formatTime(timeLeft)}
        </Text>
        
        {isCompleted && !isExpired && (
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {completedText}
          </Text>
        )}
    </View>
  );
};
