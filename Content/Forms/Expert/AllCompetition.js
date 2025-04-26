import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Config from '../../Settings/Config';
import {useIsFocused} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const CompetitionCard = ({competition, navigation, onDelete}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{competition.title}</Text>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Year:</Text>
            <Text style={styles.detailValue}>{competition.year}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Levels:</Text>
            <Text style={styles.detailValue}>
              {competition.minLevel} - {competition.maxLevel}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rounds:</Text>
            <Text style={styles.detailValue}>{competition.rounds}</Text>
          </View>

          <View style={styles.actionLinks}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('UpdateCompetition', {competition})
              }>
              <Text style={[styles.actionText, styles.editText]}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(competition.id)}>
              <Text style={[styles.actionText, styles.deleteText]}>
                🗑 Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const AllCompetitionScreen = ({navigation}) => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadCompetitions();
  }, [isFocused]);

  const loadCompetitions = () => {
    setLoading(true);
    setError('');
    fetch(`${Config.BASE_URL}/api/Competition/GetAllCompetitions`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load');
        return response.json();
      })
      .then(data => {
        setCompetitions(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setError('Failed to load competitions');
        setLoading(false);
      });
  };

  const handleDelete = async id => {
    Alert.alert('Delete Competition', 'This action cannot be undone', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Confirm Delete',
        onPress: async () => {
          try {
            const response = await fetch(
              `${Config.BASE_URL}/api/Competition/DeleteCompetition/${id}`,
              {method: 'DELETE'},
            );

            if (!response.ok) throw new Error('Delete failed');

            setCompetitions(prev => prev.filter(comp => comp.id !== id));
            Alert.alert('Success', 'Competition deleted');
          } catch (error) {
            Alert.alert('Error', error.message || 'Delete failed');
            console.error('Delete error:', error);
          }
        },
      },
    ]);
  };

  const renderItem = ({item}) => (
    <CompetitionCard
      competition={item}
      navigation={navigation}
      onDelete={handleDelete}
    />
  );

  if (loading)
    return (
      <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
    );
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={loadCompetitions}>
          <Text style={styles.buttonText}>🔄 Refresh List</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={() => navigation.navigate('CreateCompetitions')}>
          <Text style={styles.buttonText}>🏆 Create New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={competitions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No competitions found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  error: {
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  refreshButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  createButton: {
    backgroundColor: '#FFD700',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'yellow',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFD70055',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    flex: 1,
  },
  expandIcon: {
    color: '#FFD700',
    fontSize: 18,
    marginLeft: 10,
  },
  cardDetails: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFD70033',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '500',
  },
  actionLinks: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  editText: {
    color: '#FFD700',
  },
  deleteText: {
    color: '#FF4444',
  },
  emptyText: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});

export default AllCompetitionScreen;
