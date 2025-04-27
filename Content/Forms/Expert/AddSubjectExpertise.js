import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../Settings/Config';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width} = Dimensions.get('window');

const AddSubjectExpertise = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(parseInt(storedUserId));
      } else {
        Alert.alert('Authentication Required', 'Please log in to continue', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchSubjects();
    }
  }, [userId]);

  const fetchSubjects = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/Subject/GetAvailableSubjects?userId=${userId}`,
        {
          method: 'GET',
          headers: {'Content-Type': 'application/json'},
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSubjects(data);
      } else {
        Alert.alert('Error', 'Failed to fetch subjects list');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to fetch subjects list');
    } finally {
      setLoading(false);
    }
  };

  const addSubjectExpertise = async subjectCode => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${Config.BASE_URL}${Config.ENDPOINTS.postExpertSubject}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: 0,
            expertId: userId,
            subjectCode,
          }),
        },
      );

      if (!response.ok) throw new Error('Add failed');

      setSubjects(prevSubjects =>
        prevSubjects.filter(subject => subject.code !== subjectCode),
      );

      Alert.alert('Success', `Added ${subjectCode} to your expertise`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add expertise. Please try again.');
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.subjectInfo}>
        <Icon name="library-books" size={24} color="#FFD700" />
        <View style={styles.textContainer}>
          <Text style={styles.subjectCode}>{item.code}</Text>
          <Text style={styles.subjectTitle}>{item.title}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addSubjectExpertise(item.code)}>
        <Text style={styles.buttonText}>➕ Add Expertise</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Subjects</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="error-outline" size={48} color="#FFD700" />
              <Text style={styles.emptyText}>No subjects available</Text>
            </View>
          }
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
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD70033',
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 16,
  },
  subjectCode: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  subjectTitle: {
    color: '#AAAAAA',
    fontSize: 14,
    marginTop: 4,
    maxWidth: width * 0.5,
  },
  addButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingBottom: 24,
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
});

export default AddSubjectExpertise;
