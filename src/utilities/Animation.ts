import { LayoutAnimation } from 'react-native';

const animateLayout = () => {
  LayoutAnimation.configureNext({
    duration: 500,
    create: {
      type: LayoutAnimation.Types.linear,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 1,
    },
    update: { type: LayoutAnimation.Types.spring, springDamping: 1 },
    delete: {
      type: LayoutAnimation.Types.spring,
      property: LayoutAnimation.Properties.opacity,
      springDamping: 1,
    },
  });
};

export { animateLayout };
