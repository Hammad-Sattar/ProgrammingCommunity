import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../Settings/Config';
import {useNavigation} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';

const CreateCompetitionScreen = () => {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [minLevel, setMinLevel] = useState('1');
  const [maxLevel, setMaxLevel] = useState('1');
  const [roundsCount, setRoundsCount] = useState('1');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedId = await AsyncStorage.getItem('userId');
        if (storedId) {
          setUserId(storedId);
        }
      } catch (error) {
        console.error('Error retrieving user ID:', error);
      }
    };

    fetchUserId();
  }, []);

  const handleSubmit = () => {
    if (!title || !year || !minLevel || !maxLevel || !roundsCount) {
      alert('Please make sure all fields are filled!');
      return;
    }

    if (parseInt(minLevel) > parseInt(maxLevel)) {
      alert('Min level cannot be greater than Max level!');
      return;
    }

    if (!userId) {
      alert('User ID not found. Please try again.');
      return;
    }

    const competitionData = {
      id: 0,
      title: title || 'Default Title',
      year: parseInt(year, 10) || 0,
      minLevel: parseInt(minLevel, 10) || 0,
      maxLevel: parseInt(maxLevel, 10) || 0,
      userId: userId,
      rounds: roundsCount.toString(),
    };

    fetch(`${Config.BASE_URL}/api/Competition/MakeCompetition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(competitionData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setMaxLevel('');
        setMinLevel('');
        setRoundsCount('');
        setTitle('');
        setYear('');

        alert('Competition created successfully!');

        navigation.navigate('CompetitionRound', {
          title: competitionData.title,
          year: competitionData.year,
          roundsCount: competitionData.rounds,
          competitionId: data.id,
        });
      })
      .catch(error => {
        console.error('Error creating competition:', error);
        alert('Error creating competition. Please try again.');
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Competition</Text>

      <TextInput
        style={styles.input}
        placeholder="Title"
        placeholderTextColor="#FFD700"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Year"
        placeholderTextColor="#FFD700"
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Min Level</Text>
        <Picker
          selectedValue={minLevel}
          style={styles.picker}
          onValueChange={setMinLevel}>
          {[...Array(5).keys()].map(i => (
            <Picker.Item
              key={i}
              label={`Level ${i + 1}`}
              value={(i + 1).toString()}
            />
          ))}
        </Picker>

        <Text style={styles.label}>Max Level</Text>
        <Picker
          selectedValue={maxLevel}
          style={styles.picker}
          onValueChange={setMaxLevel}>
          {[...Array(5).keys()].map(i => (
            <Picker.Item
              key={i}
              label={`Level ${i + 1}`}
              value={(i + 1).toString()}
            />
          ))}
        </Picker>

        <Text style={styles.label}>Rounds</Text>
        <Picker
          selectedValue={roundsCount}
          style={styles.picker}
          onValueChange={setRoundsCount}>
          {[...Array(4).keys()].map(i => (
            <Picker.Item
              key={i}
              label={`Round ${i + 1}`}
              value={(i + 1).toString()}
            />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Add Competition Rounds</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFD700',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    color: '#FFD700',
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#FFD700',
    borderWidth: 2,
    borderRadius: 10,
    marginBottom: 15,
    paddingLeft: 15,
    color: '#FFD700',
    fontSize: 16,
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  picker: {
    width: '100%',
    height: 50,
    color: '#FFD700',
    backgroundColor: '#222',
    borderRadius: 10,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateCompetitionScreen;
