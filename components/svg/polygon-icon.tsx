import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PolygonIcon = ({ width = 24, height = 24, ...props }) => {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...props}>
      <Path
        d="M12 2L22 7L20 17L12 22L4 17L2 7L12 2Z"
        fill="#8247E5"
      />
      <Path
        d="M12 4L20 8L18.5 16L12 20L5.5 16L4 8L12 4Z"
        fill="#8247E5"
      />
    </Svg>
  );
};

export default PolygonIcon;
