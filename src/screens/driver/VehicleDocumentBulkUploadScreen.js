import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
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
import { useResponsive, responsiveFont } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { usePopup } from '../../context/PopupContext';
import { useKeyboardSafe } from '../../components/keyboard';
import { API_URL } from '../../utils/apiUrl';
import ApiConstant from '../../utils/apiConstant';
import { getAccessToken, clearTokens } from '../../utils/storage';
import {
  pickFromGallery,
  captureFromCamera,
  isImagePickerAvailable,
} from '../../utils/imagePickerHelper';
import DatePicker from 'react-native-date-picker';
import { AppDatePicker } from '../../components/AppDatePicker';

const GREEN = '#17baa1';

const DateInputTrigger = ({
  label,
  value,
  onPress,
  placeholder = 'YYYY-MM-DD',
}) => (
  <View style={styles.dateTriggerWrap}>
    <Text style={styles.dateTriggerLabel}>{label}</Text>
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.dateTriggerBtn}
    >
      <View style={styles.dateTriggerLeft}>
        <Icon name="calendar" size={17} color={value ? GREEN : '#94A3B8'} />
        <Text
          style={[
            styles.dateTriggerValue,
            !value && styles.dateTriggerPlaceholder,
          ]}
        >
          {value || placeholder}
        </Text>
      </View>
      <Icon name="chevron-down" size={15} color="#94A3B8" />
    </TouchableOpacity>
  </View>
);

export const VehicleDocumentBulkUploadScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const keyboard = useKeyboardSafe?.();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const vehicleId = route?.params?.vehicleId || 1;
  const vehicle = route?.params?.vehicle || null;

  // 1. RC (Registration Certificate)
  const [rcNumber, setRcNumber] = useState('DL08 2023 RC 445566');
  const [rcIssueDate, setRcIssueDate] = useState('2023-06-15');
  const [rcExpiryDate, setRcExpiryDate] = useState('2038-06-14');
  const [rcFileName, setRcFileName] = useState(null);
  const [rcUri, setRcUri] = useState(null);
  const [rcType, setRcType] = useState('image/jpeg');
  const [rcImageSource, setRcImageSource] = useState(null);

  // 2. Insurance
  const [insuranceNumber, setInsuranceNumber] = useState('POL-2026-889912');
  const [insuranceIssueDate, setInsuranceIssueDate] = useState('2026-01-01');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('2027-01-01');
  const [insuranceFileName, setInsuranceFileName] = useState(null);
  const [insuranceUri, setInsuranceUri] = useState(null);
  const [insuranceType, setInsuranceType] = useState('image/jpeg');
  const [insuranceImageSource, setInsuranceImageSource] = useState(null);

  // 3. PUC (Pollution Under Control)
  const [pucNumber, setPucNumber] = useState('PUC-DL-2026-33211');
  const [pucIssueDate, setPucIssueDate] = useState('2026-08-01');
  const [pucExpiryDate, setPucExpiryDate] = useState('2026-12-01');
  const [pucFileName, setPucFileName] = useState(null);
  const [pucUri, setPucUri] = useState(null);
  const [pucType, setPucType] = useState('image/jpeg');
  const [pucImageSource, setPucImageSource] = useState(null);

  // 4. Commercial / Moto Permit
  const [permitNumber, setPermitNumber] = useState('PMT-DL-2026-7788');
  const [permitIssueDate, setPermitIssueDate] = useState('2026-01-01');
  const [permitExpiryDate, setPermitExpiryDate] = useState('2029-01-01');
  const [permitFileName, setPermitFileName] = useState(null);
  const [permitUri, setPermitUri] = useState(null);
  const [permitType, setPermitType] = useState('image/jpeg');
  const [permitImageSource, setPermitImageSource] = useState(null);

  const [loading, setLoading] = useState(false);
  const [activeDocForPicker, setActiveDocForPicker] = useState(null); // 'rc' | 'insurance' | 'puc' | 'permit'
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [activeDatePicker, setActiveDatePicker] = useState(null); // { id, title, value }
  const scrollViewRef = useRef(null);

  const openDatePicker = (id, title, value) => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();
    setActiveDatePicker({ id, title, value });
  };

  const handleDateConfirm = (formattedDate) => {
    if (!activeDatePicker) return;
    const { id } = activeDatePicker;
    if (id === 'rc_issue') setRcIssueDate(formattedDate);
    else if (id === 'rc_expiry') setRcExpiryDate(formattedDate);
    else if (id === 'insurance_issue') setInsuranceIssueDate(formattedDate);
    else if (id === 'insurance_expiry') setInsuranceExpiryDate(formattedDate);
    else if (id === 'puc_issue') setPucIssueDate(formattedDate);
    else if (id === 'puc_expiry') setPucExpiryDate(formattedDate);
    else if (id === 'permit_issue') setPermitIssueDate(formattedDate);
    else if (id === 'permit_expiry') setPermitExpiryDate(formattedDate);
    setActiveDatePicker(null);
  };

  // Auto-scroll when keyboard opens
  useEffect(() => {
    if (keyboard?.keyboardVisible) {
      let scrollY = 160;
      if (keyboard?.activeInputId?.includes('insurance')) scrollY = 460;
      else if (keyboard?.activeInputId?.includes('puc')) scrollY = 760;
      else if (keyboard?.activeInputId?.includes('permit')) scrollY = 1060;

      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [keyboard?.keyboardVisible, keyboard?.activeInputId]);

  const openGalleryFor = (docType) => {
    setActiveDocForPicker(docType);
    setShowGalleryModal(true);
  };

  const handleOpenPhoneGallery = async () => {
    setShowGalleryModal(false);
    const result = await pickFromGallery();
    if (result.success) {
      applySelectedImage(result.uri, result.name, result.type);
    } else if (result.isNativeUnavailable) {
      showError(
        'Accessing device gallery requires an app rebuild ("npx react-native run-android").',
        'Rebuild Required for Real Gallery'
      );
    } else if (!result.didCancel && result.error) {
      showError(result.error, 'Gallery Error');
    }
  };

  const handleOpenPhoneCamera = async () => {
    setShowGalleryModal(false);
    const result = await captureFromCamera();
    if (result.success) {
      applySelectedImage(result.uri, result.name, result.type);
    } else if (result.isNativeUnavailable) {
      showError(
        'Accessing device camera requires an app rebuild ("npx react-native run-android").',
        'Rebuild Required for Camera'
      );
    } else if (!result.didCancel && result.error) {
      showError(result.error, 'Camera Error');
    }
  };

  const applySelectedImage = (uri, name, type) => {
    const source = uri ? { uri } : null;
    if (activeDocForPicker === 'rc') {
      setRcUri(uri);
      setRcFileName(name);
      setRcType(type);
      setRcImageSource(source);
    } else if (activeDocForPicker === 'insurance') {
      setInsuranceUri(uri);
      setInsuranceFileName(name);
      setInsuranceType(type);
      setInsuranceImageSource(source);
    } else if (activeDocForPicker === 'puc') {
      setPucUri(uri);
      setPucFileName(name);
      setPucType(type);
      setPucImageSource(source);
    } else if (activeDocForPicker === 'permit') {
      setPermitUri(uri);
      setPermitFileName(name);
      setPermitType(type);
      setPermitImageSource(source);
    }
  };

  const validateForm = () => {
    if (!rcUri && !rcImageSource) return 'Please add Registration Certificate (RC) document photo';
    if (!rcNumber.trim()) return 'Please enter Registration Certificate (RC) number';
    if (!rcIssueDate.trim()) return 'Please enter RC issue date (YYYY-MM-DD)';
    if (!rcExpiryDate.trim()) return 'Please enter RC expiry date (YYYY-MM-DD)';

    if (!insuranceUri && !insuranceImageSource) return 'Please add Motorcycle Insurance document photo';
    if (!insuranceNumber.trim()) return 'Please enter Insurance policy number';
    if (!insuranceIssueDate.trim()) return 'Please enter Insurance issue date (YYYY-MM-DD)';
    if (!insuranceExpiryDate.trim()) return 'Please enter Insurance expiry date (YYYY-MM-DD)';

    if (!pucUri && !pucImageSource) return 'Please add PUC certificate photo';
    if (!pucNumber.trim()) return 'Please enter PUC certificate number';
    if (!pucIssueDate.trim()) return 'Please enter PUC issue date (YYYY-MM-DD)';
    if (!pucExpiryDate.trim()) return 'Please enter PUC expiry date (YYYY-MM-DD)';

    if (!permitUri && !permitImageSource) return 'Please add Vehicle Permit document photo';
    if (!permitNumber.trim()) return 'Please enter Permit number';
    if (!permitIssueDate.trim()) return 'Please enter Permit issue date (YYYY-MM-DD)';
    if (!permitExpiryDate.trim()) return 'Please enter Permit expiry date (YYYY-MM-DD)';

    return null;
  };

  const handleBulkUpload = async () => {
    keyboard?.hideKeyboard?.();
    Keyboard.dismiss();

    const err = validateForm();
    if (err) {
      showError(err, 'Validation Error');
      return;
    }

    setLoading(true);
    showLoading(
      'Uploading Vehicle Documents...',
      'Submitting RC, Insurance, PUC, and Permit to server'
    );

    try {
      const token = await getAccessToken();

      // Construct multipart/form-data payload with all 16 fields matching Postman specification
      const formData = new FormData();

      // 1. RC Fields
      let rcFileUri = rcUri;
      if (!rcFileUri && rcImageSource) {
        const rcAsset = Image.resolveAssetSource(rcImageSource);
        rcFileUri = rcAsset?.uri;
      }
      formData.append('rc_file', {
        uri: rcFileUri,
        name: rcFileName || `rc_${Date.now()}.jpg`,
        type: rcType || 'image/jpeg',
      });
      formData.append('rc_number', rcNumber.trim());
      formData.append('rc_issue_date', rcIssueDate.trim());
      formData.append('rc_expiry_date', rcExpiryDate.trim());

      // 2. Insurance Fields
      let insFileUri = insuranceUri;
      if (!insFileUri && insuranceImageSource) {
        const insuranceAsset = Image.resolveAssetSource(insuranceImageSource);
        insFileUri = insuranceAsset?.uri;
      }
      formData.append('insurance_file', {
        uri: insFileUri,
        name: insuranceFileName || `insurance_${Date.now()}.jpg`,
        type: insuranceType || 'image/jpeg',
      });
      formData.append('insurance_number', insuranceNumber.trim());
      formData.append('insurance_issue_date', insuranceIssueDate.trim());
      formData.append('insurance_expiry_date', insuranceExpiryDate.trim());

      // 3. PUC Fields
      let pucFileUri = pucUri;
      if (!pucFileUri && pucImageSource) {
        const pucAsset = Image.resolveAssetSource(pucImageSource);
        pucFileUri = pucAsset?.uri;
      }
      formData.append('puc_file', {
        uri: pucFileUri,
        name: pucFileName || `puc_${Date.now()}.jpg`,
        type: pucType || 'image/jpeg',
      });
      formData.append('puc_number', pucNumber.trim());
      formData.append('puc_issue_date', pucIssueDate.trim());
      formData.append('puc_expiry_date', pucExpiryDate.trim());

      // 4. Permit Fields
      let permitFileUri = permitUri;
      if (!permitFileUri && permitImageSource) {
        const permitAsset = Image.resolveAssetSource(permitImageSource);
        permitFileUri = permitAsset?.uri;
      }
      formData.append('permit_file', {
        uri: permitFileUri,
        name: permitFileName || `permit_${Date.now()}.jpg`,
        type: permitType || 'image/jpeg',
      });
      formData.append('permit_number', permitNumber.trim());
      formData.append('permit_issue_date', permitIssueDate.trim());
      formData.append('permit_expiry_date', permitExpiryDate.trim());

      const headers = {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const endpointPath =
        typeof ApiConstant.VehicleBulkUpload === 'function'
          ? ApiConstant.VehicleBulkUpload(vehicleId)
          : `vehicles/${vehicleId}/documents/bulk-upload/`;

      const response = await fetch(`${API_URL}${endpointPath}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      hideLoading();
      setLoading(false);

      if (response.ok) {
        // Clear cached registration auth tokens so driver logs in afresh after admin KYC approval
        await clearTokens().catch(() => {});

        // Check verification_status from server response
        const isPending = Array.isArray(data)
          ? data.some(
              doc => (doc.verification_status || '').toUpperCase() === 'PENDING'
            )
          : (data?.verification_status || '').toUpperCase() === 'PENDING';

        const isApproved =
          Array.isArray(data) && data.length > 0
            ? data.every(
                doc =>
                  (doc.verification_status || '').toUpperCase() === 'APPROVED' ||
                  (doc.verification_status || '').toUpperCase() === 'VERIFIED'
              )
            : (data?.verification_status || '').toUpperCase() === 'APPROVED' ||
              (data?.verification_status || '').toUpperCase() === 'VERIFIED';

        if (isApproved) {
          showSuccess(
            'All vehicle documents have been verified and approved! You can now log in to access your driver account.',
            'KYC Verification Complete',
            () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Login',
                    params: { role: 'driver', kycApproved: true },
                  },
                ],
              });
            }
          );
        } else {
          showSuccess(
            'Your vehicle documents (RC, Insurance, PUC, Permit) have been submitted successfully!\n\nVerification Status: PENDING (KYC Under Review)\n\nOur team is reviewing your documents. Once your KYC is verified by the admin, you can log in to start accepting rides.',
            'KYC Verification Pending',
            () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'Login',
                    params: {
                      role: 'driver',
                      kycPending: true,
                      phone: route?.params?.phone,
                      email: route?.params?.email,
                    },
                  },
                ],
              });
            }
          );
        }
      } else {
        let errorMsg =
          data.message ||
          data.detail ||
          data.error ||
          (data.non_field_errors && data.non_field_errors[0]);

        if (!errorMsg) {
          const fieldErrors = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
          errorMsg = fieldErrors || 'Failed to upload vehicle documents. Please review the inputs.';
        }

        showError(errorMsg, 'Upload Failed');
      }
    } catch (err) {
      hideLoading();
      setLoading(false);
      showError(
        err.message || 'Unable to connect to vehicle documents server',
        'Connection Error'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Vehicle Documents Upload"
        onBack={() => navigation.goBack()}
        showLanguage={true}
      />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 600 : '100%' }]}>
          {/* Header Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIconCircle}>
              <Icon name="bike" size={26} color={GREEN} />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>
                Vehicle #{vehicleId} Documents Bulk Upload
              </Text>
              <Text style={styles.bannerSubtitle}>
                {vehicle?.make
                  ? `${vehicle.make} ${vehicle.model} • ${vehicle.plate_number}`
                  : 'Upload RC, Insurance, PUC, and Permit to verify your vehicle for active service.'}
              </Text>
            </View>
          </View>

          {/* =========================================================
              DOCUMENT 1: REGISTRATION CERTIFICATE (RC)
          ========================================================= */}
          <View style={styles.docSectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.docNumberBadge}>
                  <Text style={styles.docNumberText}>1</Text>
                </View>
                <Text style={styles.sectionTitleText}>Registration Certificate (RC)</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Required</Text>
              </View>
            </View>

            {/* Document Image Preview */}
            {rcImageSource ? (
              <View style={styles.previewContainer}>
                <Image source={rcImageSource} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {rcFileName}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openGalleryFor('rc')}
                    style={styles.galleryTriggerBtn}
                  >
                    <Icon name="image" size={14} color="#FFFFFF" />
                    <Text style={styles.galleryTriggerText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openGalleryFor('rc')}
                style={styles.emptyDocBox}
              >
                <View style={styles.emptyDocIconWrap}>
                  <Icon name="camera" size={22} color={GREEN} />
                </View>
                <View style={styles.emptyDocTextCol}>
                  <Text style={styles.emptyDocTitle}>Add RC Document Photo</Text>
                  <Text style={styles.emptyDocSub}>Take a photo or choose from device gallery</Text>
                </View>
                <Icon name="chevron-right" size={18} color="#888888" />
              </TouchableOpacity>
            )}

            {/* RC Form Inputs */}
            <CustomInput
              id="bulk-rc-number"
              label="RC Registration Number"
              value={rcNumber}
              onChangeText={text => setRcNumber(text.toUpperCase())}
              placeholder="e.g. DL08 2023 RC 445566"
              autoCapitalize="characters"
              leftIcon="document"
              containerStyle={styles.inputGap}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="RC Issue Date"
                  value={rcIssueDate}
                  onPress={() =>
                    openDatePicker('rc_issue', 'RC Issue Date', rcIssueDate)
                  }
                />
              </View>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="RC Expiry Date"
                  value={rcExpiryDate}
                  onPress={() =>
                    openDatePicker('rc_expiry', 'RC Expiry Date', rcExpiryDate)
                  }
                />
              </View>
            </View>
          </View>

          {/* =========================================================
              DOCUMENT 2: MOTORCYCLE INSURANCE
          ========================================================= */}
          <View style={styles.docSectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.docNumberBadge}>
                  <Text style={styles.docNumberText}>2</Text>
                </View>
                <Text style={styles.sectionTitleText}>Vehicle Insurance Policy</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Required</Text>
              </View>
            </View>

            {/* Document Image Preview */}
            {insuranceImageSource ? (
              <View style={styles.previewContainer}>
                <Image source={insuranceImageSource} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {insuranceFileName}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openGalleryFor('insurance')}
                    style={styles.galleryTriggerBtn}
                  >
                    <Icon name="image" size={14} color="#FFFFFF" />
                    <Text style={styles.galleryTriggerText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openGalleryFor('insurance')}
                style={styles.emptyDocBox}
              >
                <View style={styles.emptyDocIconWrap}>
                  <Icon name="camera" size={22} color={GREEN} />
                </View>
                <View style={styles.emptyDocTextCol}>
                  <Text style={styles.emptyDocTitle}>Add Insurance Policy Photo</Text>
                  <Text style={styles.emptyDocSub}>Take a photo or choose from device gallery</Text>
                </View>
                <Icon name="chevron-right" size={18} color="#888888" />
              </TouchableOpacity>
            )}

            <CustomInput
              id="bulk-insurance-number"
              label="Insurance Policy Number"
              value={insuranceNumber}
              onChangeText={text => setInsuranceNumber(text.toUpperCase())}
              placeholder="e.g. POL-2026-889912"
              autoCapitalize="characters"
              leftIcon="shield"
              containerStyle={styles.inputGap}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="Policy Issue Date"
                  value={insuranceIssueDate}
                  onPress={() =>
                    openDatePicker(
                      'insurance_issue',
                      'Insurance Policy Issue Date',
                      insuranceIssueDate
                    )
                  }
                />
              </View>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="Policy Expiry Date"
                  value={insuranceExpiryDate}
                  onPress={() =>
                    openDatePicker(
                      'insurance_expiry',
                      'Insurance Policy Expiry Date',
                      insuranceExpiryDate
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/* =========================================================
              DOCUMENT 3: PUC (POLLUTION UNDER CONTROL)
          ========================================================= */}
          <View style={styles.docSectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.docNumberBadge}>
                  <Text style={styles.docNumberText}>3</Text>
                </View>
                <Text style={styles.sectionTitleText}>PUC (Pollution Certificate)</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Required</Text>
              </View>
            </View>

            {/* Document Image Preview */}
            {pucImageSource ? (
              <View style={styles.previewContainer}>
                <Image source={pucImageSource} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {pucFileName}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openGalleryFor('puc')}
                    style={styles.galleryTriggerBtn}
                  >
                    <Icon name="image" size={14} color="#FFFFFF" />
                    <Text style={styles.galleryTriggerText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openGalleryFor('puc')}
                style={styles.emptyDocBox}
              >
                <View style={styles.emptyDocIconWrap}>
                  <Icon name="camera" size={22} color={GREEN} />
                </View>
                <View style={styles.emptyDocTextCol}>
                  <Text style={styles.emptyDocTitle}>Add PUC Certificate Photo</Text>
                  <Text style={styles.emptyDocSub}>Take a photo or choose from device gallery</Text>
                </View>
                <Icon name="chevron-right" size={18} color="#888888" />
              </TouchableOpacity>
            )}

            <CustomInput
              id="bulk-puc-number"
              label="PUC Certificate Number"
              value={pucNumber}
              onChangeText={text => setPucNumber(text.toUpperCase())}
              placeholder="e.g. PUC-DL-2026-33211"
              autoCapitalize="characters"
              leftIcon="document"
              containerStyle={styles.inputGap}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="PUC Issue Date"
                  value={pucIssueDate}
                  onPress={() =>
                    openDatePicker('puc_issue', 'PUC Issue Date', pucIssueDate)
                  }
                />
              </View>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="PUC Expiry Date"
                  value={pucExpiryDate}
                  onPress={() =>
                    openDatePicker(
                      'puc_expiry',
                      'PUC Expiry Date',
                      pucExpiryDate
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/* =========================================================
              DOCUMENT 4: VEHICLE PERMIT
          ========================================================= */}
          <View style={styles.docSectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.docNumberBadge}>
                  <Text style={styles.docNumberText}>4</Text>
                </View>
                <Text style={styles.sectionTitleText}>Commercial / Moto Permit</Text>
              </View>
              <View style={styles.badgeSuccess}>
                <Text style={styles.badgeSuccessText}>Required</Text>
              </View>
            </View>

            {/* Document Image Preview */}
            {permitImageSource ? (
              <View style={styles.previewContainer}>
                <Image source={permitImageSource} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {permitFileName}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => openGalleryFor('permit')}
                    style={styles.galleryTriggerBtn}
                  >
                    <Icon name="image" size={14} color="#FFFFFF" />
                    <Text style={styles.galleryTriggerText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openGalleryFor('permit')}
                style={styles.emptyDocBox}
              >
                <View style={styles.emptyDocIconWrap}>
                  <Icon name="camera" size={22} color={GREEN} />
                </View>
                <View style={styles.emptyDocTextCol}>
                  <Text style={styles.emptyDocTitle}>Add Vehicle Permit Photo</Text>
                  <Text style={styles.emptyDocSub}>Take a photo or choose from device gallery</Text>
                </View>
                <Icon name="chevron-right" size={18} color="#888888" />
              </TouchableOpacity>
            )}

            <CustomInput
              id="bulk-permit-number"
              label="Permit Number"
              value={permitNumber}
              onChangeText={text => setPermitNumber(text.toUpperCase())}
              placeholder="e.g. PMT-DL-2026-7788"
              autoCapitalize="characters"
              leftIcon="document"
              containerStyle={styles.inputGap}
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="Permit Issue Date"
                  value={permitIssueDate}
                  onPress={() =>
                    openDatePicker(
                      'permit_issue',
                      'Permit Issue Date',
                      permitIssueDate
                    )
                  }
                />
              </View>
              <View style={styles.halfInput}>
                <DateInputTrigger
                  label="Permit Expiry Date"
                  value={permitExpiryDate}
                  onPress={() =>
                    openDatePicker(
                      'permit_expiry',
                      'Permit Expiry Date',
                      permitExpiryDate
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/* SUBMIT BUTTON */}
          <CustomButton
            title="Upload All Vehicle Documents"
            onPress={handleBulkUpload}
            loading={loading}
            variant="primary"
            icon="arrow-right"
            iconPosition="right"
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>

      {/* PHONE GALLERY & CAMERA MODAL */}
      <Modal
        visible={showGalleryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowGalleryModal(false)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Icon name="camera" size={22} color={GREEN} />
                <Text style={styles.modalTitle}>
                  Upload {activeDocForPicker?.toUpperCase()} Photo
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowGalleryModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={20} color="#777777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Take a photo using your camera or select from your phone gallery
            </Text>

            {!isImagePickerAvailable() && (
              <View style={styles.nativeNoticeCard}>
                <Icon name="alert-circle" size={18} color="#D97706" />
                <View style={styles.nativeNoticeTextCol}>
                  <Text style={styles.nativeNoticeTitle}>App Rebuild Required</Text>
                  <Text style={styles.nativeNoticeSub}>
                    Run "npx react-native run-android" in terminal to enable device gallery & camera permissions.
                  </Text>
                </View>
              </View>
            )}

            {/* ACTION 1: PHONE GALLERY */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenPhoneGallery}
              style={styles.pickerOptionCard}
            >
              <View style={styles.pickerOptionIconCircle}>
                <Icon name="image" size={24} color={GREEN} />
              </View>
              <View style={styles.pickerOptionTextCol}>
                <Text style={styles.pickerOptionTitle}>Choose from Phone Gallery</Text>
                <Text style={styles.pickerOptionSub}>
                  Select document photo from device storage
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color={GREEN} />
            </TouchableOpacity>

            {/* ACTION 2: DEVICE CAMERA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenPhoneCamera}
              style={styles.pickerOptionCard}
            >
              <View style={[styles.pickerOptionIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Icon name="camera" size={24} color="#0284C7" />
              </View>
              <View style={styles.pickerOptionTextCol}>
                <Text style={styles.pickerOptionTitle}>Take Photo with Camera</Text>
                <Text style={styles.pickerOptionSub}>
                  Capture fresh photo of your {activeDocForPicker?.toUpperCase()} document
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#0284C7" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowGalleryModal(false)}
              style={styles.modalDoneBtn}
            >
              <Text style={styles.modalDoneBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* REACT-NATIVE-DATE-PICKER MODAL */}
      <AppDatePicker
        open={Boolean(activeDatePicker)}
        title={activeDatePicker?.title || 'Select Date'}
        value={activeDatePicker?.value || ''}
        onConfirm={handleDateConfirm}
        onCancel={() => setActiveDatePicker(null)}
      />
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
  docSectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  docNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docNumberText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: responsiveFont(13),
  },
  sectionTitleText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeSuccess: {
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.round,
  },
  badgeSuccessText: {
    color: GREEN,
    fontSize: responsiveFont(11),
    fontWeight: '700',
  },
  previewContainer: {
    width: '100%',
    height: 140,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#B7F5E5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.88,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewFileName: {
    color: '#FFFFFF',
    fontSize: responsiveFont(11),
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  galleryTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  galleryTriggerText: {
    color: '#FFFFFF',
    fontSize: responsiveFont(11),
    fontWeight: '700',
  },
  inputGap: {
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  dateTriggerWrap: {
    marginBottom: 12,
  },
  dateTriggerLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  dateTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.medium,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  dateTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateTriggerValue: {
    fontSize: responsiveFont(13),
    fontWeight: '700',
    color: '#0F172A',
  },
  dateTriggerPlaceholder: {
    fontWeight: '400',
    color: '#94A3B8',
  },
  submitBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: responsiveFont(18),
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: responsiveFont(13),
    color: '#64748B',
    marginBottom: SPACING.lg,
  },
  pickerOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  pickerOptionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pickerOptionTextCol: {
    flex: 1,
    marginRight: 8,
  },
  pickerOptionTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerOptionSub: {
    ...TYPOGRAPHY.caption,
    color: '#64748B',
    marginTop: 2,
  },
  emptyDocBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  emptyDocIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  emptyDocTextCol: {
    flex: 1,
  },
  emptyDocTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyDocSub: {
    ...TYPOGRAPHY.caption,
    color: '#64748B',
    marginTop: 2,
  },
  modalDoneBtn: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#334155',
    fontSize: responsiveFont(15),
    fontWeight: '700',
  },
  nativeNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 10,
  },
  nativeNoticeTextCol: {
    flex: 1,
  },
  nativeNoticeTitle: {
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: '#92400E',
  },
  nativeNoticeSub: {
    fontSize: responsiveFont(11),
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
});

export default VehicleDocumentBulkUploadScreen;
