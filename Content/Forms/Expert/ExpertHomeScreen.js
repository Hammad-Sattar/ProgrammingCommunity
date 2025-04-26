import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const ExpertHome = ({navigation}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.cardSmall}
          onPress={() => navigation.navigate('CreateTask')}>
          <Text style={styles.cardText}>📝 Make Task</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardSmall}
          onPress={() => navigation.navigate('AllCompetitions')}>
          <Text style={styles.cardText}>🏆 Competition</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.cardSmall}
          onPress={() => navigation.navigate('AddSubjectExpertise')}>
          <Text style={styles.cardText}>🎓 Add Expertise</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AllQuestions')}
          style={styles.cardSmall}>
          <Text style={styles.cardText}>📚 Question Bank</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cardLarge}>
        <Text style={styles.cardLargeText}>▲ Student Leaderboard</Text>
      </TouchableOpacity>

      <View style={styles.expertiseSection}>
        <Text style={styles.sectionTitle}>Your Expertise</Text>
        <Text style={styles.viewAll}>View all ›</Text>
      </View>

      <TouchableOpacity style={styles.cardExpertise}>
        <Text style={styles.expertiseTitle}>Web Development</Text>
        <Text style={styles.expertiseSubtitle}>Programming</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardSmall: {
    width: '48%',
    height: 120,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD70033',
  },
  cardLarge: {
    width: '100%',
    height: 100,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 4,
  },
  cardLargeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  expertiseSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  viewAll: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardExpertise: {
    width: '100%',
    height: 100,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    paddingLeft: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  expertiseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  expertiseSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '500',
    marginTop: 8,
  },
});

export default ExpertHome;
