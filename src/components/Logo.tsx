import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { color as tokens } from '../theme';

export interface LogoMarkProps {
  /** Rendered height in px (width derives from the 67:60 artwork ratio). */
  height?: number;
  /** Fill colour. Defaults to Anugrah Blue; pass white for reversed on navy. */
  fill?: string;
}

const RATIO = 67 / 60;

/**
 * The Anugrah three-stroke ascending wing mark, drawn from the vector master
 * (viewBox 67×60). One source of artwork truth — tint via `fill`.
 * Never tint teal.
 */
export function LogoMark({ height = 26, fill = tokens.anugrahBlue }: LogoMarkProps) {
  return (
    <Svg width={height * RATIO} height={height} viewBox="0 0 67 60" fill="none">
      <Path
        d="M0 58C4 36.2588 27.3333 9.88235 48 0C36.8 6.32471 42 50.7529 48 58C39 55 35.3333 40.2118 30.6667 32.9647C26 25.7176 12.6667 40.2118 0 58Z"
        fill={fill}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M65.3033 0C61.4012 4.74426 58.4511 10.301 56.7452 16.3783C55.657 20.2545 55.0751 24.3425 55.0751 28.5664C55.0751 40.338 59.595 51.0538 66.9941 59.0732C62.5534 49.4939 60.0751 38.8196 60.0751 27.5664C60.0751 23.4888 60.4005 19.4872 61.0268 15.5862C61.8954 10.1755 63.3427 4.95825 65.3033 0Z"
        fill={fill}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M56.3033 0C51.8353 5.43225 48.6155 11.9299 47.0823 19.0543C46.4225 22.1206 46.0751 25.303 46.0751 28.5664C46.0751 40.338 50.595 51.0538 57.9941 59.0732C53.5534 49.4939 51.0751 38.8196 51.0751 27.5664C51.0751 24.1904 51.2982 20.8666 51.7303 17.6088C52.5441 11.474 54.0995 5.57349 56.3033 0Z"
        fill={fill}
      />
    </Svg>
  );
}

export default LogoMark;
