import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {TextInput, PaperProvider} from 'react-native-paper';
import {Picker} from '@react-native-picker/picker';
import {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import Config from '../../Settings/Config';

const CompetitionRoundScreen = ({navigation, route}) => {
  const {title, year, competitionId, roundsCount} = route.params;

  const [date, setDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [roundId, setRoundId] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [addedQuestions, setAddedQuestions] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    console.log(
      `Competition: ${title} ${year} ${competitionId} ${roundsCount}`,
    );
  }, [title, year, competitionId, roundsCount]);

  useEffect(() => {
    let filtered = questions;

    if (selectedType) {
      if (selectedType === '1') {
        filtered = filtered.filter(question => question.type === 2);
      } else if (selectedType === '2') {
        filtered = filtered; // No filter applied here
      } else if (selectedType === '3') {
        filtered = filtered.filter(question => question.type === 3);
      } else if (selectedType === '4') {
        filtered = filtered.filter(question => question.type === 2);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(question =>
        question.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredQuestions(filtered);
  }, [selectedType, searchQuery, questions]);

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      mode: 'date',
      value: new Date(),
      onChange: (event, selectedDate) => {
        if (selectedDate) {
          const formattedDate = selectedDate.toISOString().split('T')[0];
          setDate(formattedDate);
        }
      },
    });
  };

  const fetchAllQuestions = async () => {
    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/Questions/GetAllQuestionsWithOption`,
      );
      const data = await response.json();
      console.log('Fetched questions:', data);
      setQuestions(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch questions');
      console.error(error);
    }
  };

  const addRound = async () => {
    if (!date || !selectedType) {
      Alert.alert('Validation Error', 'Please select a date and round type.');
      return;
    }

    const requestBody = {
      id: 0,
      competitionId: competitionId,
      roundNumber: roundNumber,
      roundType: parseInt(selectedType),
      date: date,
    };

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionRound/AddCompetitonRound`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add round');
      }

      const jsonData = await response.json();
      if (jsonData.roundId) {
        setRoundId(jsonData.roundId);
        Alert.alert('Success', 'Round added successfully!');
        fetchAllQuestions();
      } else {
        console.error('Invalid response format:', jsonData);
      }
    } catch (error) {
      console.error('Error adding round:', error);
    }
  };

  const renderQuestion = ({item}) => {
    const isAdded = addedQuestions[item.id];
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionRow}>
          <Text style={styles.questionText}>{item.text}</Text>
          <TouchableOpacity
            style={[styles.addButton, isAdded && styles.addedButton]}
            onPress={() => handleAddToRound(item)}
            disabled={isAdded}>
            <Text style={styles.addButtonText}>
              {isAdded ? 'Added' : 'Add to Round'}
            </Text>
          </TouchableOpacity>
        </View>
        {item.options && item.options.length > 0 && (
          <View>
            {item.options.map((option, index) => (
              <Text key={index} style={styles.optionText}>
                {`${option.option} - ${
                  option.isCorrect ? 'Correct' : 'Incorrect'
                }`}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const handleAddToRound = async question => {
    const requestBody = {
      id: 0,
      competitionRoundId: roundId,
      questionId: question.id,
    };

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionRoundQuestion/AddCompetitionRoundQuestion`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add question to round');
      }

      setAddedQuestions(prevState => ({
        ...prevState,
        [question.id]: true,
      }));

      Alert.alert('Success', 'Question Added to Round');
    } catch (error) {
      console.error('Error adding question to round:', error);
      Alert.alert('Error', 'Failed to add question to round');
    }
  };

  const handleNextRound = () => {
    if (Object.keys(addedQuestions).length === 0) {
      Alert.alert('Error', 'Please add at least one question to the round.');
      return;
    }

    setAddedQuestions({});
    setDate('');
    setSelectedType('');
    setFilteredQuestions([]);
    setQuestions([]);

    setRoundNumber(prev => prev + 1);
  };

  const handleFinishCompetition = () => {
    if (Object.keys(addedQuestions).length === 0) {
      Alert.alert('Error', 'Please add at least one question to the round.');
      return;
    }

    Alert.alert('Success', 'Competition created successfully!', [
      {text: 'OK', onPress: () => navigation.navigate('ExpertHome')},
    ]);
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{`${title} ${year}`}</Text>
        </View>

        <Text style={styles.sectionTitle}>Round Details</Text>
        <Text style={styles.sectionTitle}>Round {roundNumber}</Text>

        <TouchableOpacity onPress={showDatePicker} style={styles.dateInput}>
          <Text style={styles.dateText}>
            {date ? date : 'Select Start Date'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.typeLabel}>Type :</Text>
        <View style={styles.dropdown}>
          <Picker
            selectedValue={selectedType}
            onValueChange={itemValue => setSelectedType(itemValue)}
            style={styles.picker}>
            <Picker.Item label="Select Type" value="" />
            <Picker.Item label="MCQS" value="1" />
            <Picker.Item label="Speed Programming" value="2" />
            <Picker.Item label="Shuffle" value="3" />
            <Picker.Item label="Buzzer" value="4" />
          </Picker>
        </View>

        <TouchableOpacity
          onPress={addRound}
          style={[
            styles.button,
            !date || !selectedType ? styles.disabledButton : null,
          ]}
          disabled={!date || !selectedType}>
          <Text style={styles.buttonText}>Add Questions</Text>
        </TouchableOpacity>

        {questions.length > 0 && (
          <>
            <TextInput
              placeholder="Search questions"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#FFD700"
            />

            <FlatList
              data={filteredQuestions}
              renderItem={renderQuestion}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.flatListContent}
            />
          </>
        )}

        <View style={styles.buttonContainer}>
          {roundNumber < roundsCount && (
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNextRound}>
              <Text style={styles.buttonText}>Next Round</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.finishButton,
              roundNumber < roundsCount && styles.disabledButton,
            ]}
            onPress={handleFinishCompetition}
            disabled={roundNumber < roundsCount}>
            <Text style={styles.buttonText}>Finish Competition</Text>
          </TouchableOpacity>
        </View>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  headerText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 16,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    letterSpacing: 0.5,
  },
  dateInput: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FFD70055',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dateText: {
    color: '#FFF',
    fontSize: 16,
  },
  typeLabel: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 20,
  },
  dropdown: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD70055',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  picker: {
    color: '#FFD700',
  },
  button: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#1a1a1a',

    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD70055',
    marginTop: 20,
    color: '#FFD700',
    fontSize: 16,
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    textcolor: 'white',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  questionContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FFD70055',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    color: '#FFD700',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 20,
  },
  addButton: {
    backgroundColor: '#FFD700',
    padding: 8,
    borderRadius: 8,
  },
  addedButton: {
    backgroundColor: '#666',
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  nextButton: {
    flex: 1,
    marginRight: 10,
  },
  finishButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.6,
  },
});

export default CompetitionRoundScreen;
