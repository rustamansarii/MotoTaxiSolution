import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import ProfileAvatar from '../../components/ProfileAvatar';
import CustomModal from '../../components/CustomModal';
import StatusBadge from '../../components/StatusBadge';
import Icon from '../../components/Icon';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import LanguageButton from '../../components/LanguageButton';
import LanguageModal from '../../components/LanguageModal';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { clearTokens, isGuestMode } from '../../utils/storage';
import { fetchUserProfile } from '../../redux/features/auth/authSlice';
import { fetchDriverDocuments } from '../../redux/features/driver/driverSlice';
import { CustomAlertPopup } from '../../components/CustomAlertPopup';
import { useResponsive, responsiveFont } from '../../utils/responsive';

/**
 * Format document date string
 */
const formatDocDate = (dateString, t, language = 'en') => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const localeMap = {
      en: 'en-US',
      fr: 'fr-FR',
      hi: 'hi-IN',
    };
    const currentLocale = localeMap[language] || 'en-US';
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString(currentLocale, { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

/**
 * Get readable name for document types
 */
const getDocTypeLabel = (docType, t) => {
  const type = (docType || '').toUpperCase();
  switch (type) {
    case 'LICENSE':
      return t ? t('driver.docLicenseType', "Driver's License") : "Driver's License";
    case 'RC':
      return t
        ? t('driver.docRcType', 'Registration Certificate (RC)')
        : 'Registration Certificate (RC)';
    case 'INSURANCE':
      return t
        ? t('driver.docInsuranceType', 'Vehicle Insurance Policy')
        : 'Vehicle Insurance Policy';
    case 'PUC':
      return t
        ? t('driver.docPucType', 'Pollution Certificate (PUC)')
        : 'Pollution Certificate (PUC)';
    case 'PERMIT':
      return t
        ? t('driver.docPermitType', 'Commercial Vehicle Permit')
        : 'Commercial Vehicle Permit';
    default:
      return docType || (t ? t('driver.document', 'Document') : 'Document');
  }
};

/**
 * Map document status to StatusBadge config
 */
const getDocStatusBadge = (status, t) => {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'APPROVED':
    case 'VERIFIED':
      return {
        status: 'completed',
        label: t ? t('driver.statusApproved', 'APPROVED') : 'APPROVED',
      };
    case 'REJECTED':
      return {
        status: 'danger',
        label: t ? t('driver.statusRejected', 'REJECTED') : 'REJECTED',
      };
    case 'UNDER_REVIEW':
      return {
        status: 'pending',
        label: t ? t('driver.underReview', 'UNDER REVIEW') : 'UNDER REVIEW',
      };
    case 'PENDING':
    default:
      return {
        status: 'pending',
        label: t ? t('driver.statusPending', 'PENDING') : 'PENDING',
      };
  }
};

export const DriverProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language || 'en';
  const dispatch = useDispatch();
  const { isFoldableOrTablet, isSplitLayout, insets } = useResponsive();

  const authUser = useSelector((state) => state.auth?.user);
  const driverState = useSelector((state) => state.driver);
  const driverProfile = driverState?.driverProfile || authUser?.driver_profile;

  const {
    driverDocumentsData,
    isDocumentsLoading = false,
    documentsError = null,
  } = driverState;

  const { language } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const currentLanguageInfo = useMemo(() => {
    if (language === 'hi') return { flag: '🇮🇳', name: 'हिन्दी', code: 'HI' };
    if (language === 'fr') return { flag: '🇫🇷', name: 'Français', code: 'FR' };
    return { flag: '🇺🇸', name: 'English', code: 'EN' };
  }, [language]);

  const [isGuestStored, setIsGuestStored] = useState(false);
  useEffect(() => {
    isGuestMode().then((val) => {
      if (val) setIsGuestStored(true);
    });
  }, []);
  const isGuest = !authUser || !authUser?.id || isGuestStored;

  const [guestLoginModal, setGuestLoginModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const promptGuestLogin = (
    msgKey = 'auth.loginRequiredGeneralMsg',
    defMsg = 'Please log in first to access this feature.'
  ) => {
    setGuestLoginModal({
      visible: true,
      title: t('auth.loginRequired', 'Login Required'),
      message: t(msgKey, defMsg),
    });
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const handleCheckDocuments = () => {
    dispatch(fetchDriverDocuments());
    setShowDocsModal(true);
  };

  const displayName = useMemo(() => {
    const raw =
      authUser?.full_name ||
      (authUser?.first_name ? `${authUser.first_name} ${authUser.last_name || ''}`.trim() : null) ||
      authUser?.name;
    if (raw) {
      return raw
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return t('auth.guestDriver', 'Guest Driver');
  }, [authUser, t]);

  const displayPhone = authUser?.phone_number || authUser?.phone || '';
  const displayEmail = authUser?.email || '';
  const displayRating =
    driverProfile?.rating_avg ||
    authUser?.rider_profile?.rating_avg ||
    authUser?.rating ||
    '5.00';
  const displayTrips =
    driverProfile?.total_trips !== undefined
      ? t('driver.tripsCount', {
        count: driverProfile.total_trips,
        defaultValue: `${driverProfile.total_trips} Trips`,
      })
      : authUser?.total_rides !== undefined
        ? t('driver.tripsCount', {
          count: authUser.total_rides,
          defaultValue: `${authUser.total_rides} Trips`,
        })
        : t('driver.tripsCount', { count: 0, defaultValue: '0 Trips' });

  const memberSince = useMemo(() => {
    const raw = authUser?.date_joined || authUser?.created_at;
    if (!raw) return null;
    try {
      const localeMap = { en: 'en-US', fr: 'fr-FR', hi: 'hi-IN' };
      const currentLocale = localeMap[currentLanguage] || 'en-US';
      return new Date(raw).toLocaleDateString(currentLocale, {
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [authUser, currentLanguage]);

  // Driver verification status from GET /api/v1/auth/profile/
  const driverVerification =
    authUser?.driver_verification ||
    useSelector((state) => state.auth?.driverVerification);
  const verificationStatus = (
    driverVerification?.status || 'APPROVED'
  ).toUpperCase();
  const isVerified =
    driverVerification?.verified ?? (verificationStatus === 'APPROVED');
  const verificationDetail =
    driverVerification?.detail ||
    (isVerified
      ? t(
        'driver.verifiedReadyDesc',
        'Driver is fully verified and ready to go online.'
      )
      : t(
        'driver.verificationPendingDesc',
        'Document verification in progress.'
      ));

  const verificationStatusLabel = isVerified
    ? t('driver.statusApproved', 'APPROVED')
    : verificationStatus === 'UNDER_REVIEW'
      ? t('driver.underReview', 'UNDER REVIEW')
      : t('driver.statusPending', 'PENDING');

  // Document arrays from API response
  const driverDocs = useMemo(() => {
    return Array.isArray(driverDocumentsData?.driver_documents)
      ? driverDocumentsData.driver_documents
      : [];
  }, [driverDocumentsData]);

  const vehicleDocs = useMemo(() => {
    return Array.isArray(driverDocumentsData?.vehicle_documents)
      ? driverDocumentsData.vehicle_documents
      : [];
  }, [driverDocumentsData]);

  const totalDocsCount = driverDocs.length + vehicleDocs.length;

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await clearTokens();
    navigation.replace('Login');
  };

  const isMultiColumn = isFoldableOrTablet || isSplitLayout;

  const driverOverview = (
    <>
      {/* Driver Hero Card */}
      <View style={styles.driverHeroCard}>
        <View style={styles.heroTopBar}>
          <LanguageButton variant="light" />
        </View>

        <ProfileAvatar
          imageUri={authUser?.profile_photo}
          name={displayName}
          size={84}
          isOnline={true}
          showStatus={true}
          showEdit={true}
          onEditPress={() => {
            if (isGuest) {
              promptGuestLogin(
                'auth.loginRequiredProfileMsg',
                'Please log in first to edit and save your personal details.'
              );
              return;
            }
            navigation.navigate('PersonalDetails');
          }}
        />

        <Text style={styles.driverName}>{displayName}</Text>

        {!authUser ? (
          <View style={styles.guestBadgePill}>
            <Icon name="user" size={12} color={COLORS.primary} />
            <Text style={styles.guestBadgeText}>
              {t('auth.guestMode', 'GUEST MODE')}
            </Text>
          </View>
        ) : null}

        {displayPhone ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (isGuest) {
                promptGuestLogin(
                  'auth.loginRequiredProfileMsg',
                  'Please log in first to edit and save your personal details.'
                );
                return;
              }
              navigation.navigate('PersonalDetails');
            }}
          >
            <Text style={styles.driverPhone}>{displayPhone}</Text>
          </TouchableOpacity>
        ) : null}
        {displayEmail ? <Text style={styles.driverEmail}>{displayEmail}</Text> : null}

        {(!authUser || isGuest) ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              promptGuestLogin(
                'auth.loginRequiredProfileMsg',
                'Please log in first to access driver profile features.'
              );
            }}
            style={styles.guestSignInPrompt}
          >
            <Text style={styles.guestSignInPromptText}>
              {t('auth.guestLoginPrompt', 'Sign in to access all features')}
            </Text>
            <Icon name="arrow-right" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.statsPillsRow}>
          <View style={styles.statPill}>
            <Icon name="star" size={12} color={COLORS.primary} />
            <Text style={styles.statPillText}>
              {t('driver.ratingLabel', {
                rating: displayRating,
                defaultValue: `${displayRating} Rating`,
              })}
            </Text>
          </View>

          <View style={styles.statPill}>
            <Icon name="time" size={12} color={COLORS.textLight} />
            <Text style={styles.statPillText}>{displayTrips}</Text>
          </View>

          <View style={styles.statPill}>
            <Icon name="calendar" size={12} color={COLORS.textLight} />
            <Text style={styles.statPillText}>
              {memberSince
                ? t('driver.sinceDate', {
                  date: memberSince,
                  defaultValue: `Since ${memberSince}`,
                })
                : t('driver.partner', 'Partner')}
            </Text>
          </View>
        </View>
      </View>

      {/* Driver Verification Status Banner */}
      <TouchableOpacity
        activeOpacity={isGuest ? 0.75 : 1}
        onPress={() => {
          if (isGuest) {
            promptGuestLogin(
              'auth.loginRequiredDocsMsg',
              'Please log in first to view official verification documents.'
            );
          }
        }}
        style={styles.verificationCard}
      >
        <View style={styles.verificationHeader}>
          <View
            style={[
              styles.verificationIconBox,
              isVerified ? styles.verificationIconBoxVerified : styles.verificationIconBoxPending,
            ]}
          >
            <Icon
              name="shield"
              size={20}
              color={isVerified ? COLORS.primaryDark : COLORS.warning}
            />
          </View>
          <View style={styles.verificationTitleCol}>
            <View style={styles.verificationStatusRow}>
              <Text style={styles.verificationStatusTitle}>
                {t('driver.accountVerification', 'Account Verification')}
              </Text>
              <StatusBadge
                status={isVerified ? 'completed' : 'pending'}
                label={verificationStatusLabel}
                size="small"
              />
            </View>
            <Text style={styles.verificationStatusDetail}>
              {verificationDetail}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );

  const driverDetails = (
    <>
      {/* Partner Menu Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t('driver.accountAndDocs', 'Account & Documents')}
        </Text>

        {/* Personal Details */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (isGuest) {
              promptGuestLogin(
                'auth.loginRequiredProfileMsg',
                'Please log in first to edit and save your personal details.'
              );
              return;
            }
            navigation.navigate('PersonalDetails');
          }}
          style={styles.menuRow}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
            <Icon name="user" size={18} color="#4F46E5" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>
              {t('driver.personalDetails', 'Personal Details')}
            </Text>
            <Text style={styles.menuSub}>
              {t(
                'driver.personalDetailsSub',
                'Name, phone, email & emergency contact'
              )}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
        </TouchableOpacity>

        {/* Check Document Details Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (isGuest) {
              promptGuestLogin(
                'auth.loginRequiredDocsMsg',
                'Please log in first to view official verification documents.'
              );
              return;
            }
            handleCheckDocuments();
          }}
          style={styles.menuRow}
        >
          <View style={[styles.menuIconBox, styles.menuIconBoxHighlight]}>
            <Icon name="document" size={18} color={COLORS.primaryDark} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>
              {t('driver.checkDocDetails', 'Check Document Details')}
            </Text>
            <Text style={styles.menuSub}>
              {t(
                'driver.checkDocDetailsSub',
                'License, RC, Insurance, PUC & Permit'
              )}
            </Text>
          </View>
          <View style={styles.checkDocsBadge}>
            <Text style={styles.checkDocsBadgeText}>
              {totalDocsCount > 0
                ? t('driver.docsCountBadge', {
                  count: totalDocsCount,
                  defaultValue: `${totalDocsCount} Docs`,
                })
                : t('driver.check', 'Check')}
            </Text>
            <Icon name="chevron-right" size={14} color={COLORS.primaryDark} />
          </View>
        </TouchableOpacity>

        {/* Language Selection */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowLanguageModal(true)}
          style={styles.menuRow}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
            <Icon name="globe" size={18} color="#059669" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>
              {t('settings.language', 'Language')}
            </Text>
            <Text style={styles.menuSub}>
              {t('common.switchLanguage', 'Switch Language')}
            </Text>
          </View>
          <View style={styles.langBadgePill}>
            <Text style={styles.langBadgePillFlag}>
              {currentLanguageInfo.flag}
            </Text>
            <Text style={styles.langBadgePillText}>
              {currentLanguageInfo.name}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={COLORS.iconLight} />
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (isGuest) {
              promptGuestLogin(
                'auth.loginRequiredGeneralMsg',
                'Please log in first to access this feature.'
              );
              return;
            }
            navigation.navigate('DeleteAccount');
          }}
          style={[styles.menuRow, { borderBottomWidth: 0 }]}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Icon name="trash" size={18} color={COLORS.danger} />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={[styles.menuTitle, { color: COLORS.danger }]}>
              {t('driver.deleteAccount', 'Delete Account')}
            </Text>
            <Text style={styles.menuSub}>
              {t(
                'driver.deleteAccountSub',
                'Permanently close and delete your account'
              )}
            </Text>
          </View>
          <Icon name="chevron-right" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Logout / Exit Guest */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (isGuest) {
            promptGuestLogin(
              'auth.loginRequiredGeneralMsg',
              'Please log in first to access this feature.'
            );
            return;
          }
          if (!authUser) {
            navigation.replace('Login');
          } else {
            setShowLogoutModal(true);
          }
        }}
        style={styles.logoutBtn}
      >
        <Icon
          name={isGuest ? 'log-out' : 'log-out'}
          size={16}
          color={isGuest ? COLORS.primary : COLORS.danger}
        />
        <Text style={[styles.logoutText, isGuest && { color: COLORS.primary }]}>
          {isGuest ? t('auth.login', 'Log In / Sign In') : t('rider.logout', 'Log Out')}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ResponsiveContainer maxWidth={920} style={{ flex: 1 }}>
        <Header
          title={t('driver.driverProfile')}
          showBack={false}
          variant="light"
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + SPACING.lg, SPACING.xxxl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isMultiColumn ? (
            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                {driverOverview}
              </View>
              <View style={styles.splitCol}>
                {driverDetails}
              </View>
            </View>
          ) : (
            <>
              {driverOverview}
              {driverDetails}
            </>
          )}
        </ScrollView>
      </ResponsiveContainer>

      {/* Document Details Modal */}
      <Modal
        visible={showDocsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDocsModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowDocsModal(false)}
        >
          <Pressable style={styles.docsModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.docsModalHeader}>
              <View>
                <Text style={styles.docsModalTitle}>
                  {t('driver.docVerificationTitle', 'Document Verification')}
                </Text>
                <Text style={styles.docsModalSub}>
                  {t(
                    'driver.docVerificationSub',
                    'Official Records Approved by MotoTaxi'
                  )}
                </Text>
              </View>
              <View style={styles.docsHeaderActions}>
                <TouchableOpacity
                  onPress={() => dispatch(fetchDriverDocuments())}
                  style={styles.docsRefreshBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="refresh" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDocsModal(false)}
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={18} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {isDocumentsLoading && !driverDocumentsData ? (
              <View style={styles.docsLoadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.docsLoadingText}>
                  {t('driver.fetchingDocs', 'Fetching verified documents...')}
                </Text>
              </View>
            ) : documentsError && !driverDocumentsData ? (
              <View style={styles.docsErrorBox}>
                <Icon name="alert-circle" size={24} color={COLORS.danger} />
                <Text style={styles.docsErrorText}>{String(documentsError)}</Text>
                <TouchableOpacity
                  onPress={() => dispatch(fetchDriverDocuments())}
                  style={styles.docsRetryBtn}
                >
                  <Text style={styles.docsRetryBtnText}>
                    {t('common.retry', 'Retry')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.docsScroll}
              >
                {/* Verification Summary Banner */}
                <View style={styles.verificationBanner}>
                  <View style={styles.verificationBannerIcon}>
                    <Icon name="shield" size={20} color={COLORS.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verificationBannerTitle}>
                      {t(
                        'driver.allDocsVerified',
                        'All Required Documents Verified'
                      )}
                    </Text>
                    <Text style={styles.verificationBannerSub}>
                      {t('driver.docsOnFile', {
                        count: totalDocsCount,
                        defaultValue: `${totalDocsCount} official document records currently on file.`,
                      })}
                    </Text>
                  </View>
                </View>

                {/* 1. Driver Documents Section */}
                <View style={styles.docSection}>
                  <View style={styles.docSectionHeader}>
                    <Icon name="user" size={15} color={COLORS.primary} />
                    <Text style={styles.docSectionTitle}>
                      {t('driver.driverDocuments', 'Driver Documents')}
                    </Text>
                  </View>

                  {driverDocs.length === 0 ? (
                    <Text style={styles.noDocText}>
                      {t(
                        'driver.noDriverDocsYet',
                        'No driver documents uploaded yet.'
                      )}
                    </Text>
                  ) : (
                    driverDocs.map((doc) => {
                      const statusBadge = getDocStatusBadge(doc.status, t);
                      return (
                        <View key={`ddoc_${doc.id}`} style={styles.docItemCard}>
                          <View style={styles.docItemTopRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docTypeTitle}>
                                {getDocTypeLabel(doc.document_type, t)}
                              </Text>
                              <Text style={styles.docDateText}>
                                {t('driver.uploadedDate', {
                                  date: formatDocDate(
                                    doc.uploaded_at,
                                    t,
                                    currentLanguage
                                  ),
                                  defaultValue: `Uploaded: ${formatDocDate(
                                    doc.uploaded_at,
                                    t,
                                    currentLanguage
                                  )}`,
                                })}
                              </Text>
                            </View>
                            <StatusBadge
                              status={statusBadge.status}
                              label={statusBadge.label}
                              size="small"
                            />
                          </View>

                          {doc.rejection_reason ? (
                            <View style={styles.rejectionBox}>
                              <Icon name="alert-circle" size={13} color={COLORS.danger} />
                              <Text style={styles.rejectionText}>
                                {doc.rejection_reason}
                              </Text>
                            </View>
                          ) : null}

                          {doc.file ? (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() =>
                                setPreviewImage({
                                  uri: doc.file,
                                  title: getDocTypeLabel(doc.document_type, t),
                                })
                              }
                              style={styles.docPreviewRow}
                            >
                              <Image
                                source={{ uri: doc.file }}
                                style={styles.docThumbnail}
                                resizeMode="cover"
                              />
                              <View style={styles.docPreviewTextCol}>
                                <Text style={styles.docFileName}>
                                  {t(
                                    'driver.verifiedDocCopy',
                                    'Verified Document Copy'
                                  )}
                                </Text>
                                <Text style={styles.tapToViewText}>
                                  {t(
                                    'driver.tapToPreview',
                                    'Tap to preview full file'
                                  )}
                                </Text>
                              </View>
                              <Icon name="chevron-right" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* 2. Vehicle Documents Section */}
                <View style={styles.docSection}>
                  <View style={styles.docSectionHeader}>
                    <Icon name="car" size={15} color={COLORS.secondPrimary} />
                    <Text style={styles.docSectionTitle}>
                      {t('driver.vehicleDocuments', 'Vehicle Documents')}
                    </Text>
                  </View>

                  {vehicleDocs.length === 0 ? (
                    <Text style={styles.noDocText}>
                      {t(
                        'driver.noVehicleDocsYet',
                        'No vehicle documents uploaded yet.'
                      )}
                    </Text>
                  ) : (
                    vehicleDocs.map((doc) => {
                      const statusBadge = getDocStatusBadge(
                        doc.verification_status,
                        t
                      );
                      return (
                        <View key={`vdoc_${doc.id}`} style={styles.docItemCard}>
                          <View style={styles.docItemTopRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.docTypeTitle}>
                                {getDocTypeLabel(doc.document_type, t)}
                              </Text>
                              {doc.document_number ? (
                                <View style={styles.docNumberBadge}>
                                  <Text style={styles.docNumberText}>
                                    {doc.document_number}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <StatusBadge
                              status={statusBadge.status}
                              label={statusBadge.label}
                              size="small"
                            />
                          </View>

                          {/* Dates Row */}
                          <View style={styles.docDatesRow}>
                            <View style={styles.docDateCol}>
                              <Text style={styles.docDateLabel}>
                                {t('driver.issued', 'Issued')}
                              </Text>
                              <Text style={styles.docDateVal}>
                                {formatDocDate(
                                  doc.issue_date,
                                  t,
                                  currentLanguage
                                )}
                              </Text>
                            </View>
                            <View style={styles.docDateCol}>
                              <Text style={styles.docDateLabel}>
                                {t('driver.expires', 'Expires')}
                              </Text>
                              <Text style={styles.docDateVal}>
                                {formatDocDate(
                                  doc.expiry_date,
                                  t,
                                  currentLanguage
                                )}
                              </Text>
                            </View>
                            {doc.verified_at ? (
                              <View style={styles.docDateCol}>
                                <Text style={styles.docDateLabel}>
                                  {t('driver.verified', 'Verified')}
                                </Text>
                                <Text style={styles.docDateVal}>
                                  {formatDocDate(
                                    doc.verified_at,
                                    t,
                                    currentLanguage
                                  )}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {doc.rejection_reason ? (
                            <View style={styles.rejectionBox}>
                              <Icon name="alert-circle" size={13} color={COLORS.danger} />
                              <Text style={styles.rejectionText}>
                                {doc.rejection_reason}
                              </Text>
                            </View>
                          ) : null}

                          {doc.document_file ? (
                            <TouchableOpacity
                              activeOpacity={0.85}
                              onPress={() =>
                                setPreviewImage({
                                  uri: doc.document_file,
                                  title: getDocTypeLabel(doc.document_type, t),
                                })
                              }
                              style={styles.docPreviewRow}
                            >
                              <Image
                                source={{ uri: doc.document_file }}
                                style={styles.docThumbnail}
                                resizeMode="cover"
                              />
                              <View style={styles.docPreviewTextCol}>
                                <Text style={styles.docFileName}>
                                  {t(
                                    'driver.attachedDocFile',
                                    'Attached Document File'
                                  )}
                                </Text>
                                <Text style={styles.tapToViewText}>
                                  {t(
                                    'driver.tapToPreview',
                                    'Tap to preview full file'
                                  )}
                                </Text>
                              </View>
                              <Icon name="chevron-right" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowDocsModal(false)}
                  style={styles.docsCloseCta}
                >
                  <Text style={styles.docsCloseCtaText}>
                    {t('common.close', 'Close')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full-Screen Image Preview Modal */}
      <Modal
        visible={Boolean(previewImage)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <Pressable
          style={styles.imageViewerBackdrop}
          onPress={() => setPreviewImage(null)}
        >
          <SafeAreaView style={styles.imageViewerContent}>
            <View style={styles.imageViewerHeader}>
              <Text style={styles.imageViewerTitle} numberOfLines={1}>
                {previewImage?.title ||
                  t('driver.documentPreview', 'Document Preview')}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewImage(null)}
                style={styles.imageViewerCloseBtn}
              >
                <Icon name="close" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.imageWrapper}>
              {previewImage?.uri ? (
                <Image
                  source={{ uri: previewImage.uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>

      {/* Logout Modal */}
      <CustomModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('rider.logout')}
        message={t(
          'driver.driverLogoutMsg',
          'You will go offline and will not receive any ride requests while signed out.'
        )}
        confirmText={t('rider.logout')}
        cancelText={t('common.cancel')}
        isDanger={true}
        onConfirm={handleLogout}
        icon="alert-triangle"
      />

      {/* Guest Mode Login Required Alert Popup */}
      <CustomAlertPopup
        visible={guestLoginModal.visible}
        type="warning"
        title={guestLoginModal.title || t('auth.loginRequired', 'Login Required')}
        message={guestLoginModal.message}
        confirmText={t('auth.login', 'Log In')}
        cancelText={t('common.cancel', 'Cancel')}
        onConfirm={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }}
        onCancel={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
        }}
        onClose={() => {
          setGuestLoginModal({ visible: false, title: '', message: '' });
        }}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  splitRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    alignItems: 'flex-start',
  },
  splitCol: {
    flex: 1,
  },
  driverHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTopBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.xs,
  },
  driverName: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  driverPhone: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  driverEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary || '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  guestBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6FAF7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    marginTop: 6,
  },
  guestBadgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    fontWeight: '800',
    color: '#0e7061',
    letterSpacing: 0.5,
  },
  guestSignInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.medium,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: SPACING.sm,
  },
  guestSignInPromptText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(12),
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsPillsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statPillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 3,
  },
  verificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  verificationIconBoxVerified: {
    backgroundColor: '#DCFCE7',
  },
  verificationIconBoxPending: {
    backgroundColor: '#FEF3C7',
  },
  verificationTitleCol: {
    flex: 1,
  },
  verificationStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verificationStatusTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  verificationStatusDetail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconBoxHighlight: {
    backgroundColor: COLORS.primaryLight,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  checkDocsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    gap: 2,
  },
  checkDocsBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontSize: responsiveFont(11),
  },
  langBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langBadgePillFlag: {
    fontSize: responsiveFont(12),
    marginRight: 4,
    includeFontPadding: false,
  },
  langBadgePillText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    marginVertical: SPACING.md,
  },
  logoutText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: SPACING.xs,
  },

  // Document Details Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  docsModalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '88%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.extraLarge,
    padding: SPACING.lg,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  docsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
  },
  docsModalTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.text,
  },
  docsModalSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  docsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  docsRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docsLoadingBox: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  docsLoadingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  docsErrorBox: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  docsErrorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    textAlign: 'center',
  },
  docsRetryBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.small,
  },
  docsRetryBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
  },
  docsScroll: {
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  verificationBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBannerTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  verificationBannerSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontSize: responsiveFont(11),
    marginTop: 1,
  },
  docSection: {
    gap: SPACING.sm,
  },
  docSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.xs,
  },
  docSectionTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  noDocText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontStyle: 'italic',
    paddingVertical: SPACING.xs,
  },
  docItemCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  docItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docTypeTitle: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '700',
    color: COLORS.text,
  },
  docDateText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    color: COLORS.textLight,
    marginTop: 2,
  },
  docNumberBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  docNumberText: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  docDatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  docDateCol: {
    gap: 1,
  },
  docDateLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(10),
    color: COLORS.textLight,
  },
  docDateVal: {
    ...TYPOGRAPHY.caption,
    fontSize: responsiveFont(11),
    fontWeight: '700',
    color: COLORS.text,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: SPACING.xs,
    borderRadius: RADIUS.small,
    gap: 4,
  },
  rejectionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    fontSize: responsiveFont(11),
    flex: 1,
  },
  docPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.small,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    gap: SPACING.sm,
  },
  docThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: COLORS.inputBg,
  },
  docPreviewTextCol: {
    flex: 1,
  },
  docFileName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    fontSize: responsiveFont(11),
  },
  tapToViewText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDark,
    fontSize: responsiveFont(10),
    fontWeight: '600',
  },
  docsCloseCta: {
    backgroundColor: COLORS.inputBg,
    borderRadius: RADIUS.round,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  docsCloseCtaText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
  },

  // Image Viewer Modal
  imageViewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  imageViewerContent: {
    flex: 1,
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  imageViewerTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: '700',
    flex: 1,
  },
  imageViewerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default DriverProfileScreen;
