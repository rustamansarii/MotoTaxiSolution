import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import Icon from '../../components/Icon';
import { useResponsive } from '../../utils/responsive';

const INITIAL_DOCS = [
  {
    id: 'doc_1',
    title: "Driver's License (Front & Back)",
    subtitle: 'Expires Oct 2028',
    status: 'verified',
    statusLabel: 'Verified',
  },
  {
    id: 'doc_2',
    title: 'Vehicle Registration',
    subtitle: 'Tesla Model Y • Expires Dec 2026',
    status: 'verified',
    statusLabel: 'Verified',
  },
  {
    id: 'doc_3',
    title: 'Personal / Commercial Auto Insurance',
    subtitle: 'Underwriting review in progress',
    status: 'pending',
    statusLabel: 'Under Review',
  },
  {
    id: 'doc_4',
    title: 'Annual 19-Point Vehicle Inspection',
    subtitle: 'Certified mechanic inspection form',
    status: 'verified',
    statusLabel: 'Verified',
  },
];

export const DocumentUploadScreen = ({ navigation }) => {
  const { isFoldableOrTablet, insets } = useResponsive();
  const [docs, setDocs] = useState(INITIAL_DOCS);
  const [loading, setLoading] = useState(false);

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('DriverNav');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Required Documents"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, SPACING.xxxl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerWrapper, { maxWidth: isFoldableOrTablet ? 580 : '100%' }]}>
          <View style={styles.banner}>
          <Icon name="shield" size={24} color={COLORS.primary} />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Account Ready for Activation</Text>
            <Text style={styles.bannerSubtitle}>
              3 of 4 documents verified. You can start driving as soon as insurance approval finishes.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Document Checklist</Text>

        <View style={styles.docsList}>
          {docs.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docIconCircle}>
                <Icon name="document" size={20} color={COLORS.secondPrimary} />
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

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.uploadBtn}
              >
                <Icon name="camera" size={16} color={COLORS.secondPrimary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <CustomButton
          title="Complete Onboarding & Go Online"
          onPress={handleFinish}
          loading={loading}
          variant="primary"
          icon="check-circle"
          iconPosition="right"
          style={styles.finishBtn}
        />
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.xxxl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: COLORS.text,
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
    backgroundColor: COLORS.inputBg,
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
  uploadBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  finishBtn: {
    marginTop: SPACING.xxl,
  },
});

export default DocumentUploadScreen;
