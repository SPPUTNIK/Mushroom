import { ViewPropTypes, ColorPropType, EdgeInsetsPropType, PointPropType } from 'deprecated-react-native-prop-types';

// Re-export the PropTypes
export {
  ViewPropTypes,
  ColorPropType,
  EdgeInsetsPropType,
  PointPropType
};

// Override the global PropTypes
if (global.PropTypes) {
  global.PropTypes = {
    ...global.PropTypes,
    ViewPropTypes,
    ColorPropType,
    EdgeInsetsPropType,
    PointPropType
  };
} 