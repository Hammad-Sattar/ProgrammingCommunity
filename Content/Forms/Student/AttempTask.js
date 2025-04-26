import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Config from '../../Settings/Config';

const TaskAttempScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation(); // Initialize navigation

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/api/Task/GetAllTasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleTaskPress = taskId => {
    navigation.navigate('TaskAnswerScreen', {taskId});
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleTaskPress(item.id)}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>Week No : {item.id}</Text>
        {/* <Text style={styles.cardSubtitle}>
          Levels: {item.minLevel} - {item.maxLevel}
        </Text> */}
        <Text style={styles.cardSubtitle}>Start: {item.startDate}</Text>
        <Text style={styles.cardSubtitle}>End: {item.endDate}</Text>
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
});

export default TaskAttempScreen;
