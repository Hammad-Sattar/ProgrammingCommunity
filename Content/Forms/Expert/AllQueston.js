import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Config from '../../Settings/Config';

const AllQuestionscreen = ({navigation}) => {
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionType, setQuestionType] = useState('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAllQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.BASE_URL}/api/Questions/GetAllQuestionsWithOption`,
      );
      const data = await response.json();

      // Filter questions based on the selected question type
      const filteredQuestions = data.filter(
        question => question.type === parseInt(questionType),
      );

      setAllQuestions(filteredQuestions);
      setError('');
    } catch (error) {
      setError('Failed to fetch questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQuestions();
  }, [questionType]);

  const renderQuestion = ({item}) => (
    <View style={styles.questionCard}>
      <Text style={styles.questionText}>{item.text}</Text>
      <View style={styles.optionsContainer}>
        {item.options?.map((option, index) => (
          <View
            key={index}
            style={[
              styles.optionBadge,
              option.isCorrect ? styles.correctOption : styles.incorrectOption,
            ]}>
            <Text style={styles.optionText}>{option.option}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Question Bank</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('ExpertSubject')}>
          <Text style={styles.addButtonText}>+ New Question</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={questionType}
          style={styles.picker}
          dropdownIconColor="#FFD700"
          onValueChange={setQuestionType}>
          <Picker.Item label="Sentence Questions" value="1" />
          <Picker.Item label="MCQs Questions" value="2" />
          <Picker.Item label="Code Questions" value="3" />
        </Picker>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : allQuestions.length === 0 ? (
        <Text style={styles.emptyText}>No questions found</Text>
      ) : (
        <FlatList
          data={allQuestions}
          renderItem={renderQuestion}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  addButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#FFD700',
    backgroundColor: '#1a1a1a',
  },
  questionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFD70055',
    elevation: 6,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  questionText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  correctOption: {
    backgroundColor: '#4CAF50',
  },
  incorrectOption: {
    backgroundColor: '#F44336',
  },
  optionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  emptyText: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
});

export default AllQuestionscreen;
