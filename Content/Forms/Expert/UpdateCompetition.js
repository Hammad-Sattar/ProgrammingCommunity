import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Config from '../../Settings/Config';

const UpdateCompetitionScreen = ({route, navigation}) => {
  const {competition} = route.params;

  const [title, setTitle] = useState(competition.title);
  const [year, setYear] = useState(competition.year.toString());
  const [minLevel, setMinLevel] = useState(competition.minLevel.toString());
  const [maxLevel, setMaxLevel] = useState(competition.maxLevel.toString());
  const [rounds, setRounds] = useState(competition.rounds.toString());

  const handleUpdate = async () => {
    const updatedCompetition = {
      title,
      year: parseInt(year),
      minLevel: parseInt(minLevel),
      maxLevel: parseInt(maxLevel),
      userId: competition.userId,
      rounds: rounds,
    };

    const competitionId = competition.id;

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/Competition/UpdateCompetition/${competitionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedCompetition),
        },
      );

      if (response.ok) {
        Alert.alert('Success', 'Competition updated successfully.');
        navigation.goBack();
      } else {
        const errorData = await response.json();
        Alert.alert(
          'Error',
          errorData.message || 'Failed to update competition',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Update failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title:</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text style={styles.label}>Year:</Text>
      <TextInput
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Min Level:</Text>
      <TextInput
        value={minLevel}
        onChangeText={setMinLevel}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Max Level:</Text>
      <TextInput
        value={maxLevel}
        onChangeText={setMaxLevel}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Rounds:</Text>
      <TextInput
        value={rounds}
        onChangeText={setRounds}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity onPress={handleUpdate} style={styles.updateButton}>
        <Text style={styles.buttonText}>Update Competition</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  label: {
    color: '#FFD700',
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#FFF',
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#000',
  },
});

export default UpdateCompetitionScreen;
