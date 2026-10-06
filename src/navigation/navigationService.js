import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Navigate to a given route name
 */
export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

/**
 * Reset entire navigation stack to a given screen
 */
export const resetTo = (name, params) => {
  const resetAction = CommonActions.reset({
    index: 0,
    routes: [{ name, ...(params ? { params } : {}) }],
  });

  if (navigationRef.isReady()) {
    navigationRef.dispatch(resetAction);
  } else {
    const interval = setInterval(() => {
      if (navigationRef.isReady()) {
        clearInterval(interval);
        navigationRef.dispatch(resetAction);
      }
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  }
};

/**
 * Reset navigation stack to Login screen
 */
export const resetToLogin = () => {
  console.log('[NavigationService] Resetting navigation to Login screen...');
  resetTo('Login');
};

export default {
  navigationRef,
  navigate,
  resetTo,
  resetToLogin,
};
