import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { type DynamicStyles } from './types';

export function useDynamicStyles(): DynamicStyles {
  const { width, height } = useWindowDimensions();

  // Calculate dynamic sizes based on screen dimensions
  const isSmallWidth = width <= 360; // iPhone SE and similar small width devices
  const isMediumWidth = width > 360 && width < 400;

  // Calculate height-based constraints
  const isSmallHeight = height <= 667; // iPhone SE and similar small height devices
  const isMediumHeight = height > 667 && height < 736;

  // Combined size detection for more accurate responsive design
  const isSmallScreen = isSmallWidth || isSmallHeight;
  const isMediumScreen = (isMediumWidth && !isSmallHeight) || (isMediumHeight && !isSmallWidth);

  // Detect extremely constrained devices (both small width and height)
  const isExtremelyConstrained = isSmallWidth && isSmallHeight;

  // Dynamic style values using memoization for performance
  const dynamicStyles = useMemo<DynamicStyles>(
    () => ({
      fontSize: {
        // Adjust font sizes based on both width and height
        amount: isExtremelyConstrained ? 'text-xl' : isSmallScreen ? 'text-2xl' : isMediumScreen ? 'text-3xl' : 'text-4xl',
        label: isSmallScreen ? 'text-xs' : 'text-sm',
        quickAmount: isSmallScreen ? 'text-xs' : 'text-xs',
        modalTitle: isSmallScreen ? 'text-base' : isMediumScreen ? 'text-lg' : 'text-xl',
        modalAmount: isExtremelyConstrained
          ? 'text-base'
          : isSmallScreen
            ? 'text-lg'
            : isMediumScreen
              ? 'text-xl'
              : 'text-2xl',
        title: isSmallScreen ? 'text-lg' : 'text-xl',
      },
      spacing: {
        // Optimize spacing for different screen sizes
        cardPadding: isExtremelyConstrained ? 'p-2' : isSmallScreen ? 'p-3' : isMediumScreen ? 'p-4' : 'p-5',
        quickAmountGap: isSmallScreen ? 'gap-1' : 'gap-1.5',
        containerMargin: isSmallHeight ? 'my-0.5' : isSmallScreen ? 'my-1' : isMediumScreen ? 'my-2' : 'my-3',
      },
      size: {
        // Adjust component sizes based on available space
        quickAmountMinWidth: isExtremelyConstrained
          ? 'min-w-[50px]'
          : isSmallScreen
            ? 'min-w-[55px]'
            : isMediumScreen
              ? 'min-w-[60px]'
              : 'min-w-[70px]',
        tapCardImage: isExtremelyConstrained
          ? 'size-24'
          : isSmallScreen
            ? 'size-28'
            : isMediumScreen
              ? 'size-32'
              : 'size-40',
        buttonSize: isSmallScreen ? 'md' : isMediumScreen ? 'lg' : 'xl',
      },
      numpad: {
        // Optimize numpad for different screen sizes
        height: isExtremelyConstrained
          ? 34 // Extremely constrained devices (both small width and height)
          : isSmallHeight
            ? 42 // Small height devices need taller buttons for better touch targets
            : isSmallScreen
              ? 40 // Small screen devices (width-constrained)
              : isMediumScreen
                ? 48 // Medium screen devices
                : 56, // Large screen devices
        fontSize: isExtremelyConstrained
          ? 18 // Smaller font for extremely constrained devices
          : isSmallHeight
            ? 22 // Slightly smaller font for height-constrained devices
            : isSmallScreen
              ? 24 // Small screen devices
              : isMediumScreen
                ? 28 // Medium screen devices
                : 36, // Large screen devices
        margin: isExtremelyConstrained
          ? 1 // Minimal margin for extremely constrained devices
          : isSmallHeight
            ? 2 // Small margin for height-constrained devices
            : isSmallScreen
              ? 2 // Small screen devices
              : isMediumScreen
                ? 3 // Medium screen devices
                : 6, // Large screen devices
      },
    }),
    [isSmallScreen, isMediumScreen, isSmallHeight, isExtremelyConstrained]
  );

  return dynamicStyles;
}
