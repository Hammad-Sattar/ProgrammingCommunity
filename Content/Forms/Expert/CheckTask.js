import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const CheckTaskscreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [noTasksMessage, setNoTasksMessage] = useState('');
  const [storedUserId, setStoredUserId] = useState(null);
  const navigation = useNavigation();

  const fetchTasks = async userId => {
    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/Task/GetTasksByUser?userId=${userId}`,
      );
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      if (data.length === 0) {
        setNoTasksMessage('Task has no submission till yet.');
      } else {
        setNoTasksMessage('');
      }
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      setNoTasksMessage('Failed to fetch tasks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchUserIdAndTasks = async () => {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        setStoredUserId(userId);
        fetchTasks(userId);
      }
    };
    fetchUserIdAndTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (storedUserId) {
      fetchTasks(storedUserId);
    }
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('CheckAttemptedTaskQuestion', {
          taskId: item.id,
        })
      }>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>Week No: {item.id}</Text>
        <Text style={styles.cardSubtitle}>
          Start: {item.startDate?.split('T')[0]}
        </Text>
        <Text style={styles.cardSubtitle}>
          End: {item.endDate?.split('T')[0]}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {noTasksMessage ? (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyText}>{noTasksMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FFD700']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  listContent: {
    padding: 16,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  cardContent: {},
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFD700',
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
});

export default CheckTaskscreen;
