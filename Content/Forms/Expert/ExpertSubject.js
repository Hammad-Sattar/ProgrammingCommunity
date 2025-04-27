import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../Settings/Config';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ExpertSubjectScreen = ({navigation}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expertId, setExpertId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setExpertId(parseInt(id, 10));
          fetchSubjects(parseInt(id, 10));
        } else {
          setError('Authentication required');
          navigation.goBack();
        }
      } catch (error) {
        console.error('AsyncStorage error:', error);
        setError('Failed to load user data');
      }
    };

    initialize();
  }, []);

  const fetchSubjects = async userId => {
    try {
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

  const handlePress = subject => {
    navigation.navigate('AddQuestions', {subject});
  };

  const renderItem = ({item}) => (
    <TouchableOpacity style={styles.card} onPress={() => handlePress(item)}>
      <Icon name="library-books" size={24} color="#FFD700" />
      <View style={styles.textContainer}>
        <Text style={styles.subjectCode}>{item.subjectCode}</Text>
        <Text style={styles.subjectTitle}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#FFD700" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Expertise</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : subjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="error-outline" size={48} color="#FFD700" />
          <Text style={styles.emptyText}>No subjects found</Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD70055',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  subjectCode: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
  },
  subjectTitle: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
});

export default ExpertSubjectScreen;
