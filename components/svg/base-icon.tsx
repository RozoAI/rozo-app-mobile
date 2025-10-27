import React from "react";
import Svg, { Path } from "react-native-svg";

interface BaseIconProps {
  width?: number;
  height?: number;
  testnet?: boolean;
  [key: string]: any;
}

const BaseIcon: React.FC<BaseIconProps> = ({
  width = 44,
  height = 44,
  testnet = false,
  style,
  ...props
}) => {
  // Merge the custom background style with any passed style prop
  const backgroundStyle = {
    borderRadius: 9999,
    backgroundColor: testnet ? undefined : "#0052FF",
    ...(testnet
      ? {
          // Nativewind/gluestack do not support linear gradients on view backgrounds directly,
          // so for a native SVG background, it's not currently supported in react-native-svg.
          // We'll fall back to a solid color for "testnet" unless using a gradient-capable lib.
          backgroundColor: "#738292",
        }
      : {}),
    ...style,
  };

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 44 44"
      fill="none"
      {...props}
      style={backgroundStyle}
    >
      <Path
        d="M21.9756 36C29.721 36 36 29.732 36 22C36 14.268 29.721 8 21.9756 8C14.6271 8 8.59871 13.6419 8 20.8232H26.5371V23.1768H8C8.59871 30.3581 14.6271 36 21.9756 36Z"
        fill="white"
      />
    </Svg>
  );
};

export default BaseIcon;
