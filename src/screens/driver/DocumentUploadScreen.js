import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { usePopup } from '../../context/PopupContext';
import { API_URL } from '../../utils/apiUrl';
import ApiConstant from '../../utils/apiConstant';
import { getAccessToken, getaccessToken } from '../../utils/storage';
import {
  pickFromGallery,
  captureFromCamera,
  isImagePickerAvailable,
} from '../../utils/imagePickerHelper';

const GREEN = '#17baa1';

export const DocumentUploadScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { isFoldableOrTablet, insets } = useResponsive();
  const { showLoading, hideLoading, showError, showSuccess } = usePopup();

  const passedLicenseNumber = route?.params?.licenseNumber || 'DL08 20220098764';

  const [licenseStatus, setLicenseStatus] = useState('action_required'); // 'action_required' | 'uploaded' | 'verified'
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [selectedFileType, setSelectedFileType] = useState('image/jpeg');
  const [selectedImageSource, setSelectedImageSource] = useState(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [finishLoading, setFinishLoading] = useState(false);

  const handleOpenPhoneGallery = async () => {
    setShowGalleryModal(false);
    const result = await pickFromGallery();
    if (result.success) {
      setSelectedImageUri(result.uri);
      setSelectedFileName(result.name);
      setSelectedFileType(result.type);
      setSelectedImageSource({ uri: result.uri });
    } else if (result.isNativeUnavailable) {
      showError(
        'Accessing your device gallery requires an app rebuild ("npx react-native run-android").',
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
      setSelectedImageUri(result.uri);
      setSelectedFileName(result.name);
      setSelectedFileType(result.type);
      setSelectedImageSource({ uri: result.uri });
    } else if (result.isNativeUnavailable) {
      showError(
        'Accessing device camera requires an app rebuild ("npx react-native run-android").',
        'Rebuild Required for Camera'
      );
    } else if (!result.didCancel && result.error) {
      showError(result.error, 'Camera Error');
    }
  };

  const docs = [
    {
      id: 'doc_1',
      type: 'LICENSE',
      title: t('driver.docLicense', "Driver's License (Front & Back)"),
      subtitle: `License No: ${passedLicenseNumber}`,
      status: licenseStatus === 'verified' ? 'verified' : licenseStatus === 'uploaded' ? 'pending' : 'action_required',
      statusLabel:
        licenseStatus === 'verified'
          ? t('driver.verified', 'Verified')
          : licenseStatus === 'uploaded'
          ? t('driver.uploaded', 'Uploaded')
          : t('driver.actionRequired', 'Upload Needed'),
    },
    {
      id: 'doc_2',
      type: 'REGISTRATION',
      title: t('driver.docRegistration', 'Vehicle Registration (RC)'),
      subtitle: 'Moto Taxi Standard • Expires Dec 2026',
      status: 'verified',
      statusLabel: t('driver.verified', 'Verified'),
    },
    {
      id: 'doc_3',
      type: 'INSURANCE',
      title: t('driver.docInsurance', 'Motorcycle Insurance Policy'),
      subtitle: 'Comprehensive Coverage • Active',
      status: 'verified',
      statusLabel: t('driver.verified', 'Verified'),
    },
    {
      id: 'doc_4',
      type: 'INSPECTION',
      title: t('driver.docInspection', 'Two-Wheeler Safety Check'),
      subtitle: 'Passed inspection check',
      status: 'verified',
      statusLabel: t('driver.verified', 'Verified'),
    },
  ];

  const handleUploadLicenseDocument = async () => {
    if (!selectedImageUri && !selectedImageSource) {
      showError(
        t('driver.selectDocumentFirst', 'Please choose a document photo from your gallery or camera first.'),
        t('driver.documentRequired', 'Document Photo Required')
      );
      return;
    }

    setUploadLoading(true);
    showLoading(
      t('driver.uploadingLicenseDoc', 'Uploading License Document...'),
      t('driver.uploadingDocDesc', 'Sending multipart/form-data to server')
    );

    try {
      const token = await getAccessToken();

      // Construct multipart/form-data payload according to Postman contract
      const formData = new FormData();
      formData.append('document_type', 'LICENSE');

      let fileUri = selectedImageUri;
      if (!fileUri && selectedImageSource) {
        const resolvedAsset = Image.resolveAssetSource(selectedImageSource);
        fileUri = resolvedAsset?.uri;
      }

      formData.append('file', {
        uri: fileUri,
        name: selectedFileName || `license_${Date.now()}.jpg`,
        type: selectedFileType || 'image/jpeg',
      });

      const headers = {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${ApiConstant.DriverDocuments}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      hideLoading();
      setUploadLoading(false);

      if (response.ok) {
        setLicenseStatus('verified');
        showSuccess(
          'License document uploaded and verified successfully! Next, register your vehicle details.',
          'License Upload Complete!',
          () => {
            navigation.navigate('VehicleSetup', {
              phone: route?.params?.phone,
              email: route?.params?.email,
            });
          }
        );
      } else {
        const errorMsg =
          data.message ||
          data.detail ||
          data.error ||
          (data.file && Array.isArray(data.file) ? data.file[0] : data.file) ||
          'Failed to upload license document. Please try again.';
        showError(errorMsg, t('driver.uploadFailed', 'Upload Failed'));
      }
    } catch (err) {
      hideLoading();
      setUploadLoading(false);
      showError(
        err.message || 'Unable to connect to document upload server',
        'Connection Error'
      );
    }
  };

  const handleFinish = () => {
    if (licenseStatus === 'action_required') {
      showError(
        t('driver.licenseUploadNeeded', 'Please upload your driving license document before proceeding.'),
        t('common.error', 'Document Required')
      );
      return;
    }

    setFinishLoading(true);
    setTimeout(() => {
      setFinishLoading(false);
      navigation.navigate('VehicleSetup');
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title={t('driver.documents', 'Required Documents')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 580 : '100%' }]}>
          {/* Header Banner */}
          <View style={styles.banner}>
            <Icon name="shield" size={26} color={GREEN} />
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>
                {licenseStatus === 'verified'
                  ? t('driver.allDocsVerified', 'All Documents Verified!')
                  : t('driver.licenseDocPrompt', 'Driving License Document Required')}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {licenseStatus === 'verified'
                  ? t('driver.readyToDriveDesc', 'Your documents are fully verified. You can start accepting bike rides now.')
                  : t('driver.uploadNotice', 'Upload front photo or scan of your driving license to complete activation.')}
              </Text>
            </View>
          </View>

          {/* LICENSE UPLOAD CARD WITH GALLERY PREVIEW */}
          <View style={styles.uploadHighlightCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardHeaderLeft}>
                <Icon name="document" size={22} color={GREEN} />
                <Text style={styles.highlightTitle}>
                  {t('driver.licenseUploadTitle', 'Driving License Document')}
                </Text>
              </View>
              <StatusBadge
                status={licenseStatus === 'verified' ? 'verified' : 'action_required'}
                label={licenseStatus === 'verified' ? 'Verified' : 'Upload Needed'}
                size="small"
              />
            </View>

            <Text style={styles.licenseSubtitle}>
              Registered License: <Text style={styles.boldText}>{passedLicenseNumber}</Text>
            </Text>

            {/* DOCUMENT IMAGE PREVIEW CONTAINER */}
            {selectedImageSource ? (
              <View style={styles.documentPreviewCard}>
                <Image
                  source={selectedImageSource}
                  style={styles.documentImage}
                  resizeMode="cover"
                />

                {/* Top Badge Overlay */}
                <View style={styles.imageOverlayTop}>
                  <View style={styles.verifiedTag}>
                    <Icon name="check" size={13} color="#FFFFFF" />
                    <Text style={styles.verifiedTagText}>Document Image Ready</Text>
                  </View>
                </View>

                {/* Bottom Info Bar Overlay */}
                <View style={styles.imageOverlayBottom}>
                  <View style={styles.imageMetaCol}>
                    <Text style={styles.overlayFileName} numberOfLines={1}>
                      {selectedFileName}
                    </Text>
                    <Text style={styles.overlayMetaSub}>
                      format: multipart/form-data • document_type: LICENSE
                    </Text>
                  </View>

                  {/* Change button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowGalleryModal(true)}
                    style={styles.changeOverlayBtn}
                  >
                    <Icon name="image" size={14} color="#FFFFFF" />
                    <Text style={styles.changeOverlayText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowGalleryModal(true)}
                style={styles.emptyUploadBox}
              >
                <View style={styles.emptyIconCircle}>
                  <Icon name="camera" size={28} color={GREEN} />
                </View>
                <Text style={styles.emptyBoxTitle}>No Document Photo Added</Text>
                <Text style={styles.emptyBoxSub}>
                  Tap here to take a photo or select from device gallery
                </Text>
              </TouchableOpacity>
            )}

            {/* ADD FROM GALLERY BUTTON */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowGalleryModal(true)}
              style={styles.addFromGalleryButton}
            >
              <View style={styles.galleryIconWrap}>
                <Icon name="image" size={20} color={GREEN} />
              </View>
              <View style={styles.galleryButtonTextCol}>
                <Text style={styles.galleryButtonTitle}>
                  {selectedFileName ? 'Change Document Photo' : 'Add from Gallery / Camera'}
                </Text>
                <Text style={styles.galleryButtonSubtitle}>
                  {selectedFileName ? selectedFileName : 'Take a photo or choose from device gallery'}
                </Text>
              </View>
              <Icon name="chevron-right" size={18} color="#888888" />
            </TouchableOpacity>

            {/* UPLOAD ACTION BUTTON */}
            <CustomButton
              title={
                licenseStatus === 'verified'
                  ? t('driver.reuploadLicense', 'Re-Upload License Document')
                  : t('driver.uploadDocBtn', 'Upload License Document')
              }
              onPress={handleUploadLicenseDocument}
              loading={uploadLoading}
              variant={licenseStatus === 'verified' ? 'outline' : 'primary'}
              icon="camera"
              style={styles.uploadActionButton}
            />
          </View>

          {/* DOCUMENT CHECKLIST */}
          {/* <Text style={styles.sectionTitle}>
            {t('driver.docChecklist', 'Document Checklist')}
          </Text> */}

          {/* <View style={styles.docsList}>
            {docs.map(doc => (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docIconCircle}>
                  <Icon
                    name={doc.type === 'LICENSE' ? 'document' : 'bike'}
                    size={20}
                    color={GREEN}
                  />
                </View>

                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docSubtitle}>{doc.subtitle}</Text>
                  <View style={styles.badgeWrap}>
                    <StatusBadge
                      status={doc.status}
                      label={doc.statusLabel}
                      size="small"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View> */}

          {/* FINAL COMPLETE BUTTON */}
          {/* <CustomButton
            title={
              licenseStatus === 'verified'
                ? 'Next: Register Vehicle'
                : t('driver.completeOnboarding', 'Complete Onboarding & Go Online')
            }
            onPress={handleFinish}
            loading={finishLoading}
            variant="primary"
            icon="arrow-right"
            iconPosition="right"
            style={styles.finishBtn}
          /> */}
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
                <Text style={styles.modalTitle}>Upload Document Photo</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowGalleryModal(false)}
                style={styles.modalCloseBtn}
              >
                <Icon name="close" size={20} color="#777777" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Take a clear photo with your camera or select from your phone gallery
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
                  Select a document photo from your device's photo gallery
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
                  Use your phone camera to take a fresh photo of your license
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#E8E9EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerTextCol: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  bannerTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  bannerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    lineHeight: 18,
  },
  uploadHighlightCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 2,
    borderColor: '#B7F5E5',
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.text,
  },
  licenseSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.text,
  },

  /* Document Image Preview */
  documentPreviewCard: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#B7F5E5',
  },
  documentImage: {
    width: '100%',
    height: '100%',
    opacity: 0.92,
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 186, 161, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    gap: 5,
  },
  verifiedTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  imageOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageMetaCol: {
    flex: 1,
    marginRight: 8,
  },
  overlayFileName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  overlayMetaSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  changeOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  changeOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Add From Gallery Button Field */
  addFromGalleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFFA',
    borderWidth: 1.5,
    borderColor: '#B7F5E5',
    borderStyle: 'dashed',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  galleryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  galleryButtonTextCol: {
    flex: 1,
  },
  galleryButtonTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#0e7061',
  },
  galleryButtonSubtitle: {
    fontSize: 11,
    color: '#135c51',
    marginTop: 2,
  },

  uploadActionButton: {
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  docsList: {
    gap: SPACING.md,
  },
  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F0FFFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  docSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  badgeWrap: {
    marginTop: SPACING.xs,
  },
  finishBtn: {
    marginTop: SPACING.xxl,
  },

  /* Gallery Modal Styles */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: '#DDDDDD',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#151515',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#777777',
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
  emptyUploadBox: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.medium,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6FAF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyBoxTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: '#334155',
  },
  emptyBoxSub: {
    ...TYPOGRAPHY.caption,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
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
    fontSize: 15,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  nativeNoticeSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
});

export default DocumentUploadScreen;
