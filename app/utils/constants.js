import {Dimensions, Platform} from 'react-native';

const {width, height} = Dimensions.get('window');

const isIos = () => {
  return Platform.OS === 'ios' ? true : false;
};

export {width, height, isIos};
