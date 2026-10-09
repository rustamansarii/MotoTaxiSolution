import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useTranslation } from 'react-i18next';
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { usePopup } from '../../context/PopupContext';
import { useKeyboardSafe } from '../../components/keyboard';
import { API_URL } from '../../utils/apiUrl';
import ApiConstant from '../../utils/apiConstant';
import { getAccessToken } from '../../utils/storage';

const GREEN = '#17baa1';

const VEHICLE_TYPES = [
  { id: 'CAR', label: 'Car', icon: 'car' },
  { id: 'BIKE', label: 'Bike', icon: 'bike' },
  { id: 'AUTO', label: 'Auto', icon: 'auto' },
];

export const VehicleSetupScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const keyboard = useKeyboardSafe?.();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const [vehicleType, setVehicleType] = useState('CAR');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [color, setColor] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterVehicle = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();

    setFieldErrors({});
    setGeneralError('');
    setLoading(true);
    showLoading(
      t('common.loading', 'Registering Vehicle...'),
      t('driver.savingVehicle', 'Saving vehicle information to server')
    );

    try {
      const token = await getAccessToken();

      const payload = {
        vehicle_type: vehicleType,
        make: make.trim(),
        model: model.trim(),
        plate_number: plateNumber.trim().toUpperCase(),
        color: color.trim(),
      };

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[VehicleSetup] Calling POST vehicles/ with payload:', payload);

      const response = await fetch(`${API_URL}${ApiConstant.Vehicles}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      hideLoading();
      setLoading(false);

      console.log('[VehicleSetup] Response status:', response.status, 'data:', data);

      if (response.ok && (data.id || data.pk)) {
        const createdId = data.id || data.pk;
        showSuccess(
          `Vehicle (${data.make || make} ${data.model || model}) registered successfully! ID: #${createdId}\nNext, upload your vehicle documents.`,
          'Vehicle Registered!',
          () => {
            navigation.navigate('VehicleDocumentBulkUpload', {
              vehicleId: createdId,
              vehicle: data,
              phone: route?.params?.phone,
              email: route?.params?.email,
            });
          }
        );
      } else {
        const parsedFieldErrors = {};
        let nonFieldErrMsg = '';

        if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([key, val]) => {
            const msg = Array.isArray(val) ? val.join(' ') : String(val);
            if (['make', 'model', 'plate_number', 'color', 'vehicle_type'].includes(key)) {
              parsedFieldErrors[key] = msg;
            } else if (key === 'non_field_errors' || key === 'detail' || key === 'message' || key === 'error') {
              nonFieldErrMsg = msg;
            } else {
              parsedFieldErrors[key] = msg;
            }
          });
        }

        if (Object.keys(parsedFieldErrors).length > 0) {
          setFieldErrors(parsedFieldErrors);
          if (nonFieldErrMsg) {
            setGeneralError(nonFieldErrMsg);
          }
        } else {
          const fallbackMsg = nonFieldErrMsg || 'Failed to register vehicle. Please check inputs.';
          setGeneralError(fallbackMsg);
          showError(fallbackMsg, 'Registration Failed');
        }
      }
    } catch (err) {
      hideLoading();
      setLoading(false);
      const connErrMsg = err.message || 'Unable to connect to vehicle registration server';
      setGeneralError(connErrMsg);
      showError(connErrMsg, 'Connection Error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('driver.vehicleSetup', 'Vehicle Details')}
        onBack={() => navigation.goBack()}
        showLanguage={true}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 580 : '100%' }]}>
          {/* Header Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconCircle}>
              <Icon name="bike" size={26} color={GREEN} />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Vehicle Registration</Text>
              <Text style={styles.bannerSubtitle}>
                Add your vehicle details before uploading documents.
              </Text>
            </View>
          </View>

          {/* General Error Banner */}
          {generalError ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={16} color="#D32F2F" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <TouchableWithoutFeedback
            onPress={() => {
              keyboard?.hideKeyboard?.();
              Keyboard.dismiss();
            }}
            accessible={false}
          >
            <View style={styles.formCard}>
              {/* Vehicle Type Selector */}
              <Text style={styles.inputSectionLabel}>Select Vehicle Type</Text>
              <View style={styles.typeSelectorRow}>
                {VEHICLE_TYPES.map(vt => {
                  const isSelected = vehicleType === vt.id;
                  return (
                    <TouchableOpacity
                      key={vt.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        setVehicleType(vt.id);
                        if (fieldErrors.vehicle_type) {
                          setFieldErrors(prev => ({ ...prev, vehicle_type: '' }));
                        }
                        if (generalError) setGeneralError('');
                      }}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipActive,
                      ]}
                    >
                      <Icon
                        name={vt.icon}
                        size={18}
                        color={isSelected ? GREEN : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          isSelected && styles.typeChipTextActive,
                        ]}
                      >
                        {vt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {fieldErrors.vehicle_type ? (
                <Text style={styles.fieldErrorText}>{fieldErrors.vehicle_type}</Text>
              ) : null}

              {/* Make & Model */}
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <CustomInput
                    id="vehicle-make"
                    label="Vehicle Make"
                    value={make}
                    onChangeText={text => {
                      setMake(text);
                      if (fieldErrors.make) {
                        setFieldErrors(prev => ({ ...prev, make: '' }));
                      }
                      if (generalError) setGeneralError('');
                    }}
                    error={fieldErrors.make}
                    placeholder="e.g. Maruti"
                    leftIcon="document"
                    containerStyle={styles.inputGap}
                  />
                </View>
                <View style={styles.halfInput}>
                  <CustomInput
                    id="vehicle-model"
                    label="Vehicle Model"
                    value={model}
                    onChangeText={text => {
                      setModel(text);
                      if (fieldErrors.model) {
                        setFieldErrors(prev => ({ ...prev, model: '' }));
                      }
                      if (generalError) setGeneralError('');
                    }}
                    error={fieldErrors.model}
                    placeholder="e.g. Swift"
                    leftIcon="document"
                    containerStyle={styles.inputGap}
                  />
                </View>
              </View>

              {/* License Plate Number */}
              <CustomInput
                id="vehicle-plate"
                label="License Plate Number"
                value={plateNumber}
                onChangeText={text => {
                  setPlateNumber(text.toUpperCase());
                  if (fieldErrors.plate_number) {
                    setFieldErrors(prev => ({ ...prev, plate_number: '' }));
                  }
                  if (generalError) setGeneralError('');
                }}
                error={fieldErrors.plate_number}
                placeholder="e.g. DL08 CA 1521"
                autoCapitalize="characters"
                leftIcon="document"
                containerStyle={styles.inputGap}
              />

              {/* Vehicle Color */}
              <CustomInput
                id="vehicle-color"
                label="Vehicle Color"
                value={color}
                onChangeText={text => {
                  setColor(text);
                  if (fieldErrors.color) {
                    setFieldErrors(prev => ({ ...prev, color: '' }));
                  }
                  if (generalError) setGeneralError('');
                }}
                error={fieldErrors.color}
                placeholder="e.g. White"
                leftIcon="document"
                containerStyle={styles.inputGap}
              />

              {/* Submit Button */}
              <CustomButton
                title="Save Vehicle & Upload Documents"
                onPress={handleRegisterVehicle}
                loading={loading}
                variant="primary"
                icon="arrow-right"
                iconPosition="right"
                style={styles.submitBtn}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  innerWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: SPACING.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputSectionLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.round,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeChipActive: {
    backgroundColor: '#E6FAF7',
    borderColor: GREEN,
  },
  typeChipText: {
    fontSize: responsiveFont(12),
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTextActive: {
    color: '#0e7061',
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputGap: {
    marginBottom: 14,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  fieldErrorText: {
    color: '#D32F2F',
    fontSize: responsiveFont(12),
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: RADIUS.medium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: responsiveFont(13),
    color: '#C62828',
    fontWeight: '500',
  },
});

export default VehicleSetupScreen;
