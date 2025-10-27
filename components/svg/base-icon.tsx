import React from 'react';
import Svg, { Path } from 'react-native-svg';

const BaseIcon = ({ width = 24, height = 24, ...props }) => {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...props}>
      <Path
        d="M12 2L2 7L12 12L22 7L12 2Z"
        fill="#0052FF"
      />
      <Path
        d="M2 17L12 22L22 17L12 12L2 17Z"
        fill="#0052FF"
      />
      <Path
        d="M2 12L12 17L22 12L12 7L2 12Z"
        fill="#0052FF"
      />
    </Svg>
  );
};

export default BaseIcon;
