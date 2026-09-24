import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import CustomLoadingPopup from '../components/CustomLoadingPopup';
import CustomAlertPopup from '../components/CustomAlertPopup';

export const PopupContext = createContext(null);

// Global bridge for calling popups outside React components (e.g. Redux, services)
let globalPopupRef = null;

export const showGlobalLoading = (message, subtitle) => {
  if (globalPopupRef) {
    globalPopupRef.showLoading(message, subtitle);
  }
};

export const hideGlobalLoading = () => {
  if (globalPopupRef) {
    globalPopupRef.hideLoading();
  }
};

export const showGlobalAlert = (options) => {
  if (globalPopupRef) {
    globalPopupRef.showAlert(options);
  }
};

export const showGlobalSuccess = (message, title = 'Success') => {
  showGlobalAlert({ type: 'success', title, message });
};

export const showGlobalError = (message, title = 'Error') => {
  showGlobalAlert({ type: 'error', title, message });
};

export const showGlobalWarning = (message, title = 'Warning') => {
  showGlobalAlert({ type: 'warning', title, message });
};

export const showGlobalInfo = (message, title = 'Info') => {
  showGlobalAlert({ type: 'info', title, message });
};

export const PopupProvider = ({ children }) => {
  // Loading state
  const [loadingState, setLoadingState] = useState({
    visible: false,
    message: 'Please wait...',
    subtitle: null,
  });

  // Alert state
  const [alertState, setAlertState] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
    onCancel: null,
  });

  const showLoading = useCallback((message = 'Please wait...', subtitle = null) => {
    setLoadingState({
      visible: true,
      message,
      subtitle,
    });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showAlert = useCallback(({
    type = 'info',
    title = '',
    message = '',
    confirmText = 'OK',
    cancelText = null,
    onConfirm = null,
    onCancel = null,
  }) => {
    setAlertState({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        setAlertState(prev => ({ ...prev, visible: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setAlertState(prev => ({ ...prev, visible: false }));
        if (onCancel) onCancel();
      },
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message, title = 'Success', onConfirm = null) => {
    showAlert({ type: 'success', title, message, onConfirm });
  }, [showAlert]);

  const showError = useCallback((message, title = 'Error', onConfirm = null) => {
    showAlert({ type: 'error', title, message, onConfirm });
  }, [showAlert]);

  const showWarning = useCallback((message, title = 'Warning', onConfirm = null) => {
    showAlert({ type: 'warning', title, message, onConfirm });
  }, [showAlert]);

  const showInfo = useCallback((message, title = 'Info', onConfirm = null) => {
    showAlert({ type: 'info', title, message, onConfirm });
  }, [showAlert]);

  // Connect global ref
  globalPopupRef = {
    showLoading,
    hideLoading,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  const contextValue = {
    showLoading,
    hideLoading,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <PopupContext.Provider value={contextValue}>
      {children}

      {/* Global Custom Loading Popup */}
      <CustomLoadingPopup
        visible={loadingState.visible}
        message={loadingState.message}
        subtitle={loadingState.subtitle}
      />

      {/* Global Custom Alert Popup */}
      <CustomAlertPopup
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        onClose={hideAlert}
      />
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    return {
      showLoading: showGlobalLoading,
      hideLoading: hideGlobalLoading,
      showAlert: showGlobalAlert,
      hideAlert: () => {},
      showSuccess: showGlobalSuccess,
      showError: showGlobalError,
      showWarning: showGlobalWarning,
      showInfo: showGlobalInfo,
    };
  }
  return context;
};

export default {
  PopupProvider,
  usePopup,
  showGlobalLoading,
  hideGlobalLoading,
  showGlobalAlert,
  showGlobalSuccess,
  showGlobalError,
  showGlobalWarning,
  showGlobalInfo,
};
