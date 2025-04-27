import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView, // Import ScrollView
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExpertHome = ({navigation}) => {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      setLoading(true);
      const response = await fetch(
        `${Config.BASE_URL}${Config.ENDPOINTS.getExpertSubject}?expertId=${userId}`,
      );

      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : [data]);
      setError('');
    } catch (error) {
      setError('Failed to fetch subjects');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

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

      {/* Add ScrollView for expertise */}
      <ScrollView contentContainerStyle={styles.expertiseList}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFD700" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          subjects.map(subject => (
            <TouchableOpacity key={subject.id} style={styles.cardExpertise}>
              <Text style={styles.expertiseTitle}>{subject.title}</Text>
              <Text style={styles.expertiseSubtitle}>
                {subject.subjectCode}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 28,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  cardSmall: {
    width: '48%',
    height: 130,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD70033',
    padding: 12,
  },
  cardLarge: {
    width: '100%',
    height: 110,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    padding: 16,
  },
  cardText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 4,
  },
  cardLargeText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  expertiseSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  sectionTitle: {
    fontSize: 21,
    color: '#FFD700',
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingLeft: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
  },
  viewAll: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingRight: 8,
  },
  expertiseList: {
    paddingBottom: 20, // Ensure there is some padding at the bottom of the scrollable area
  },
  cardExpertise: {
    width: '100%',
    height: 100,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFD700',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    marginBottom: 16,
  },
  expertiseTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  expertiseSubtitle: {
    fontSize: 15,
    color: '#AAAAAA',
    fontWeight: '500',
    marginTop: 10,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ExpertHome;
