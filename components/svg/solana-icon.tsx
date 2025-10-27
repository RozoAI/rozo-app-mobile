import React from 'react';
import Svg, { Path } from 'react-native-svg';

const SolanaIcon = ({ width = 24, height = 24, ...props }) => {
  return (
    <Svg viewBox="0 0 24 24" width={width} height={height} {...props}>
      <Path
        d="M5.5 4.5C5.5 3.67 6.17 3 7 3H17C17.83 3 18.5 3.67 18.5 4.5V6.5C18.5 7.33 17.83 8 17 8H7C6.17 8 5.5 7.33 5.5 6.5V4.5Z"
        fill="#9945FF"
      />
      <Path
        d="M5.5 9.5C5.5 8.67 6.17 8 7 8H17C17.83 8 18.5 8.67 18.5 9.5V11.5C18.5 12.33 17.83 13 17 13H7C6.17 13 5.5 12.33 5.5 11.5V9.5Z"
        fill="#9945FF"
      />
      <Path
        d="M5.5 14.5C5.5 13.67 6.17 13 7 13H17C17.83 13 18.5 13.67 18.5 14.5V16.5C18.5 17.33 17.83 18 17 18H7C6.17 18 5.5 17.33 5.5 16.5V14.5Z"
        fill="#9945FF"
      />
    </Svg>
  );
};

export default SolanaIcon;
