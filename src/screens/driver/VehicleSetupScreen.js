import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SPACING } from '../../theme/spacing';
import { TYPOGRAPHY } from '../../theme/typography';
import Header from '../../components/Header';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import VehicleCard from '../../components/VehicleCard';
import { MOCK_VEHICLES } from '../../data/mockVehicles';
import { useResponsive } from '../../utils/responsive';

export const VehicleSetupScreen = ({ navigation }) => {
  const { isFoldableOrTablet, insets } = useResponsive();
  const [selectedVehicle, setSelectedVehicle] = useState(MOCK_VEHICLES[1]); // Electric SUV
  const [makeModel, setMakeModel] = useState('Tesla Model Y');
  const [year, setYear] = useState('2024');
  const [color, setColor] = useState('Midnight Silver');
  const [plateNumber, setPlateNumber] = useState('7XYZ892');
  const [loading, setLoading] = useState(false);

  const handleProceed = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('DocumentUpload');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <Header
        title="Vehicle Setup"
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
          <Text style={styles.sectionTitle}>Select Vehicle Category</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the service category that matches your vehicle specifications.
        </Text>

        <View style={styles.vehiclesList}>
          {MOCK_VEHICLES.map((veh) => (
            <VehicleCard
              key={veh.id}
              vehicle={veh}
              isSelected={selectedVehicle.id === veh.id}
              onSelect={setSelectedVehicle}
            />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>
          Vehicle Information
        </Text>

        <View style={styles.form}>
          <CustomInput
            label="Make & Model"
            value={makeModel}
            onChangeText={setMakeModel}
            placeholder="e.g. Tesla Model Y"
            leftIcon="car"
          />

          <View style={styles.rowInputs}>
            <View style={styles.colInput}>
              <CustomInput
                label="Year"
                value={year}
                onChangeText={setYear}
                placeholder="2024"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.colInput}>
              <CustomInput
                label="Color"
                value={color}
                onChangeText={setColor}
                placeholder="e.g. Silver"
              />
            </View>
          </View>

          <CustomInput
            label="License Plate Number"
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="e.g. 7XYZ892"
            autoCapitalize="characters"
          />

          <CustomButton
            title="Next: Upload Documents"
            onPress={handleProceed}
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
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  vehiclesList: {
    gap: SPACING.xs,
  },
  form: {
    marginTop: SPACING.xs,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  colInput: {
    flex: 1,
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
});

export default VehicleSetupScreen;
