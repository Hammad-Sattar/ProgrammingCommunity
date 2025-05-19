import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useRoute} from '@react-navigation/native';
import Config from '../../Settings/Config';
import {RadioButton} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddQuestions = () => {
  const route = useRoute();
  const subject = route.params?.subject || {};
  const subjectcode = subject.subjectCode || '';

  const [topic, setTopic] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [marks, setMarks] = useState('');
  const [mcqOptions, setMcqOptions] = useState([{text: '', isCorrect: false}]);
  const [questionText, setQuestionText] = useState('');
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    if (subjectcode) {
      const fetchTopics = async () => {
        try {
          const response = await fetch(
            `${Config.BASE_URL}${Config.ENDPOINTS.getTopicsBySubjectCode}?subjectCode=${subjectcode}`,
          );
          const data = await response.json();
          setTopics(data);
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch topics');
          console.error(error);
        }
      };

      fetchTopics();
    }
  }, [subjectcode]);

  const addMcqOption = () => {
    if (mcqOptions.length < 4) {
      setMcqOptions([...mcqOptions, {text: '', isCorrect: false}]);
    }
  };

  const handleMcqOptionChange = (index, value, field) => {
    const updatedOptions = [...mcqOptions];
    updatedOptions[index][field] = value;

    if (field === 'isCorrect' && value) {
      updatedOptions.forEach((option, idx) => {
        if (idx !== index) {
          option.isCorrect = false;
        }
      });
    }

    setMcqOptions(updatedOptions);
  };

  const handleSave = async () => {
    if (
      !subjectcode ||
      !topic ||
      !type ||
      !questionText ||
      !difficulty ||
      !marks
    ) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }

    if (type === '2' && mcqOptions.some(option => !option.text)) {
      Alert.alert('Validation Error', 'Please fill all MCQ options.');
      return;
    }

    const correctOptionsCount = mcqOptions.filter(
      option => option.isCorrect,
    ).length;
    if (type === '2' && correctOptionsCount !== 1) {
      Alert.alert(
        'Validation Error',
        'Please mark exactly one MCQ option as correct.',
      );
      return;
    }

    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        return;
      }

      const optionsData =
        type === '2'
          ? mcqOptions.map(option => ({
              option: option.text,
              isCorrect: option.isCorrect,
            }))
          : [];

      const questionData = {
        id: 0,
        subjectCode: subjectcode,
        topicId: topic,
        userId: parseInt(storedUserId, 10),
        difficulty,
        text: questionText.trim(),
        type: parseInt(type, 10),
        marks: parseInt(marks, 10),
        options: optionsData,
      };

      const response = await fetch(
        `${Config.BASE_URL}/api/Questions/AddQuestionWithOptions`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(questionData),
        },
      );

      if (response.ok) {
        Alert.alert(
          'Success',
          type === '2'
            ? 'Question with options added successfully!'
            : 'Question added successfully!',
        );
        setMarks('');
        setTopic('');
        setType('');
        setDifficulty('');
        setQuestionText('');

        setMcqOptions([
          {text: '', isCorrect: false},
          {text: '', isCorrect: false},
          {text: '', isCorrect: false},
        ]);
      } else {
        Alert.alert('Error', 'Failed to add question.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save the question and options.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Add New Question</Text>
      </View>

      <Text style={styles.sectionTitle}>Topic</Text>
      <Picker
        selectedValue={topic}
        style={styles.dropdown}
        onValueChange={setTopic}>
        <Picker.Item label="Select Topic" value="" />
        {topics.map((topicItem, index) => (
          <Picker.Item
            key={index}
            label={topicItem.title || topicItem.name}
            value={topicItem.id}
          />
        ))}
      </Picker>

      <Text style={styles.sectionTitle}>Difficulty</Text>
      <Picker
        selectedValue={difficulty}
        style={styles.dropdown}
        onValueChange={setDifficulty}>
        <Picker.Item label="Select Difficulty" value="" />
        <Picker.Item label="Easy" value="1" />
        <Picker.Item label="Medium" value="2" />
        <Picker.Item label="Hard" value="3" />
      </Picker>

      <Text style={styles.sectionTitle}>Select Marks</Text>
      <Picker
        selectedValue={marks}
        style={styles.dropdown}
        onValueChange={setMarks}>
        <Picker.Item label="Select Marks" value="" />
        <Picker.Item label="5" value="5" />
        <Picker.Item label="8" value="8" />
        <Picker.Item label="10" value="10" />
      </Picker>

      <Text style={styles.sectionTitle}>Question Type</Text>
      <Picker
        selectedValue={type}
        style={styles.dropdown}
        onValueChange={setType}>
        <Picker.Item label="Select Type" value="" />
        <Picker.Item label="Sentence" value="1" />
        <Picker.Item label="MCQ" value="2" />
        <Picker.Item label="Shuffle Code" value="3" />
      </Picker>

      <Text style={styles.sectionTitle}>
        {type === '3'
          ? 'Shuffle Code Lines (use //n to split)'
          : 'Question Text'}
      </Text>

      {type === '3' ? (
        <TextInput
          style={[styles.input, {height: 150, textAlignVertical: 'top'}]}
          placeholder="Enter your code and split lines using //n"
          multiline
          value={questionText}
          onChangeText={setQuestionText}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Enter question text"
          value={questionText}
          onChangeText={setQuestionText}
        />
      )}

      {type === '2' && (
        <>
          <Text style={styles.sectionTitle}>MCQ Options</Text>
          {mcqOptions.map((option, index) => (
            <View key={index} style={styles.mcqOption}>
              <TextInput
                style={styles.input}
                placeholder={`Option ${index + 1}`}
                value={option.text}
                onChangeText={text =>
                  handleMcqOptionChange(index, text, 'text')
                }
              />
              <View style={styles.radioButtonContainer}>
                <RadioButton
                  value={option.isCorrect}
                  status={option.isCorrect ? 'checked' : 'unchecked'}
                  onPress={() =>
                    handleMcqOptionChange(index, true, 'isCorrect')
                  }
                />
                <Text style={styles.radioLabel}>Correct</Text>
              </View>
            </View>
          ))}

          {mcqOptions.length < 4 && (
            <TouchableOpacity
              style={styles.addOptionButton}
              onPress={addMcqOption}>
              <Text style={styles.addOptionButtonText}>+ Add Option</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Question</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  headerText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 24,
    marginLeft: 24,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    letterSpacing: 0.5,
  },
  input: {
    height: 40,
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    marginBottom: 16,
    color: '#FFF',
  },
  dropdown: {
    height: 50,
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {color: '#000', fontSize: 18},
  mcqOption: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD70055',
    paddingBottom: 10,
  },
  radioButtonContainer: {flexDirection: 'row', alignItems: 'center'},
  radioLabel: {color: '#FFD700', marginLeft: 8},
  addOptionButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addOptionButtonText: {color: '#000', fontSize: 16},
});

export default AddQuestions;
