import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
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
  { id: 'CAR', label: 'Car', icon: 'navigation' },
  { id: 'BIKE', label: 'Bike', icon: 'bike' },
  { id: 'AUTO', label: 'Auto', icon: 'navigation' },
];

export const VehicleSetupScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const keyboard = useKeyboardSafe?.();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const [vehicleType, setVehicleType] = useState('CAR');
  const [make, setMake] = useState('Maruti Suzuki');
  const [model, setModel] = useState('Swift Dzire');
  const [plateNumber, setPlateNumber] = useState('DL08 CA 1521');
  const [color, setColor] = useState('White');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!make.trim()) return 'Please enter vehicle make (e.g. Maruti Suzuki)';
    if (!model.trim()) return 'Please enter vehicle model (e.g. Swift Dzire)';
    if (!plateNumber.trim()) return 'Please enter license plate number (e.g. DL08 CA 1521)';
    if (!color.trim()) return 'Please enter vehicle color (e.g. White)';
    return null;
  };

  const handleRegisterVehicle = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();

    const err = validate();
    if (err) {
      showError(err, 'Validation Error');
      return;
    }

    setLoading(true);
    showLoading('Registering Vehicle...', 'Saving vehicle information to server');

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

      const response = await fetch(`${API_URL}${ApiConstant.Vehicles}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      hideLoading();
      setLoading(false);

      if (response.ok && (data.id || data.pk)) {
        const createdId = data.id || data.pk;
        showSuccess(
          `Vehicle (${data.make} ${data.model}) registered successfully! ID: #${createdId}\nNext, upload your vehicle documents.`,
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
        let errorMsg =
          data.message ||
          data.detail ||
          data.error ||
          (data.plate_number && Array.isArray(data.plate_number) ? data.plate_number[0] : null) ||
          (data.non_field_errors && data.non_field_errors[0]);

        if (!errorMsg) {
          const fieldErrors = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
          errorMsg = fieldErrors || 'Failed to register vehicle. Please check inputs.';
        }

        showError(errorMsg, 'Registration Failed');
      }
    } catch (err) {
      hideLoading();
      setLoading(false);
      showError(
        err.message || 'Unable to connect to vehicle registration server',
        'Connection Error'
      );
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

          {/* Form Card */}
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
                    onPress={() => setVehicleType(vt.id)}
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

            {/* Make & Model */}
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <CustomInput
                  id="vehicle-make"
                  label="Vehicle Make"
                  value={make}
                  onChangeText={setMake}
                  placeholder="e.g. Maruti Suzuki"
                  leftIcon="document"
                  containerStyle={styles.inputGap}
                />
              </View>
              <View style={styles.halfInput}>
                <CustomInput
                  id="vehicle-model"
                  label="Vehicle Model"
                  value={model}
                  onChangeText={setModel}
                  placeholder="e.g. Swift Dzire"
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
              onChangeText={text => setPlateNumber(text.toUpperCase())}
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
              onChangeText={setColor}
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
});

export default VehicleSetupScreen;
