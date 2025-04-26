import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Config from '../../Settings/Config';

const CheckTaskscreen = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const userId = 9; // Hardcoded for now
      const response = await fetch(
        `${Config.BASE_URL}/api/Task/GetTasksByUser?userId=${userId}`,
      );
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      console.log('Fetched tasks:', data);
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

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>Week No: {item.id}</Text>
        <Text style={styles.cardSubtitle}>
          Start: {item.startDate?.split('T')[0]}
        </Text>
        <Text style={styles.cardSubtitle}>
          End: {item.endDate?.split('T')[0]}
        </Text>
      </View>
    </View>
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
        contentContainerStyle={
          tasks.length ? styles.listContent : styles.emptyContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FFD700']}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks found.</Text>
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
  emptyContent: {
    flexGrow: 1,
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
