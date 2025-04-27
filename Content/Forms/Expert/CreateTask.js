import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const CreateTaskScreen = () => {
  const [question, setQuestion] = useState('');
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [addedQuestions, setAddedQuestions] = useState({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isAddQuestionDisabled, setIsAddQuestionDisabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (questions.length > 0) {
      const filtered = questions.filter(item =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, questions]);

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

  const formatDate = date => date.toISOString().split('T')[0];

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const validateDates = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const oneDay = 24 * 60 * 60 * 1000;
    if (end - start < oneDay) {
      Alert.alert(
        'Invalid Dates',
        'End date must be at least 1 day after the start date.',
      );
      return false;
    }
    return true;
  };

  const handleAddQuestion = async () => {
    if (!validateDates()) return;
    if (!minLevel || !maxLevel) {
      Alert.alert('Error', 'Please enter min and max level.');
      return;
    }

    setIsAddQuestionDisabled(true);

    const requestBody = {
      id: 0,
      minLevel: parseInt(minLevel, 10),
      maxLevel: parseInt(maxLevel, 10),
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      userId: userId,
    };
    console.log('Request body:', requestBody);

    try {
      const response = await fetch(`${config.BASE_URL}/api/Task/AddTask`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to add task');

      const data = await response.json();
      setTaskId(data.id);
      Alert.alert('Success', `Task created with ID: ${data.id}`);
      await fetchQuestions();
    } catch (error) {
      console.error('Error adding task:', error.message);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        `${config.BASE_URL}/api/Questions/GetAllQuestionsWithOption`,
        {method: 'GET', headers: {'Content-Type': 'application/json'}},
      );

      if (!response.ok) throw new Error('Failed to fetch questions');

      const data = await response.json();
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error.message);
      Alert.alert('Error', 'Failed to fetch questions. Please try again.');
    }
  };

  const handleAddToTask = async question => {
    try {
      const payload = {id: 0, taskId: taskId, questionId: question.id};
      const response = await fetch(
        `${config.BASE_URL}/api/TaskQuestion/AddTaskQuestion`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload),
        },
      );

      const result = await response.text();
      setAddedQuestions(prev => ({...prev, [question.id]: true}));
      Alert.alert('Success', result);
    } catch (error) {
      console.error('Error adding question to task:', error.message);
      Alert.alert('Error', 'Failed to add question to task. Please try again.');
    }
  };

  const handleSave = () => {
    if (Object.keys(addedQuestions).length === 0) {
      Alert.alert('Error', 'Please add at least one question.');
      return;
    }
    Alert.alert('Success', 'Task saved successfully!');
    setAddedQuestions({});
    setMinLevel('');
    setMaxLevel('');
    setStartDate(new Date());
    setEndDate(new Date());
    setTaskId(null);
    setQuestions([]);
    setFilteredQuestions([]);
    setIsAddQuestionDisabled(false);
    setSearchQuery('');
  };

  const handleEvaluateTask = () => {
    navigation.navigate('CheckTask');
  };

  const renderQuestionItem = ({item}) => {
    const isAdded = addedQuestions[item.id];
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionRow}>
          <Text style={styles.questionText}>{item.text}</Text>
          <TouchableOpacity
            style={[styles.addButton, isAdded && styles.addedButton]}
            onPress={() => handleAddToTask(item)}
            disabled={isAdded}>
            <Text style={styles.addButtonText}>
              {isAdded ? 'Added' : 'Add to Task'}
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

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnim}]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>📚 Make a Task</Text>
        <TouchableOpacity
          style={styles.evaluateButton}
          activeOpacity={0.8}
          onPress={handleEvaluateTask}>
          <Text style={styles.evaluateButtonText}>📝 Evaluate</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Min Level:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Min Level"
        placeholderTextColor="#ccc"
        value={minLevel}
        onChangeText={setMinLevel}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Max Level:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Max Level"
        placeholderTextColor="#ccc"
        value={maxLevel}
        onChangeText={setMaxLevel}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Start Date:</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartDatePicker(true)}>
        <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
      </TouchableOpacity>
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}

      <Text style={styles.label}>End Date:</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowEndDatePicker(true)}>
        <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
      </TouchableOpacity>
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      <TouchableOpacity
        style={[styles.button, isAddQuestionDisabled && styles.disabledButton]}
        activeOpacity={0.8}
        onPress={handleAddQuestion}
        disabled={isAddQuestionDisabled}>
        <Text style={styles.buttonText}>➕ Add Question</Text>
      </TouchableOpacity>

      {questions.length > 0 && (
        <>
          <TextInput
            placeholder="Search questions"
            placeholderTextColor="#FFD700"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredQuestions}
            renderItem={renderQuestionItem}
            keyExtractor={item => item.id.toString()}
            style={styles.questionsList}
          />
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>🔙 Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleSave}>
          <Text style={styles.buttonText}>💾 Save</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  evaluateButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  evaluateButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  label: {
    alignSelf: 'flex-start',
    color: '#FFD700',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 45,
    backgroundColor: '#1E1E1E',
    color: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  dateButton: {
    width: '100%',
    height: 45,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  dateButtonText: {
    color: '#FFD700',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 8,
    margin: 5,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  backButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    color: '#FFD700',
  },
  questionsList: {
    width: '100%',
    marginTop: 20,
  },
  questionContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionText: {
    color: '#FFD700',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addedButton: {
    backgroundColor: '#555',
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default CreateTaskScreen;
