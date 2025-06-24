import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import 'react-native-url-polyfill/auto';
import * as signalR from '@microsoft/signalr';
import Config from '../Settings/Config';

export default function Buzzer() {
  const [connection, setConnection] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [firstPressed, setFirstPressed] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = 1; // Fixed as single user
  const competitionRoundId = 1;

  // Pre-load questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(
          `${Config.BASE_URL}/api/CompetitionRoundQuestion/GetCompetitionRoundQuestion?competitionRoundId=${competitionRoundId}`,
        );
        const questionList = await res.json();
        setQuestions(questionList);

        if (questionList.length > 0) {
          await loadQuestionDetails(questionList[0].questionId);
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;

    const setupConnection = async () => {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`http://192.168.250.196:8080/buzzerhub`)
        .withAutomaticReconnect()
        .build();

      setConnection(newConnection);

      newConnection
        .start()
        .then(() => setStatus('Connected'))
        .catch(err => setStatus(`Connection error: ${err.toString()}`));

      newConnection.onclose(() => setStatus('Disconnected'));

      newConnection.on('BuzzerPressed', (pressedUserId, questionId) => {
        setFirstPressed(pressedUserId);
        if (pressedUserId === userId) {
          Alert.alert('Success', 'You pressed first!');
        } else {
          Alert.alert('Info', `User ${pressedUserId} pressed first`);
        }
      });

      newConnection.on('BuzzerAlreadyPressed', pressedUserId => {
        Alert.alert('Info', `Buzzer already pressed by User ${pressedUserId}`);
      });

      newConnection.on('ResetBuzzer', () => {
        setFirstPressed(null);
        setAnswerText('');
        setSelectedOption(null);
      });

      newConnection.on('MoveToNextQuestion', () => {
        setCurrentQuestionIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= questions.length) {
            Alert.alert('Round Completed', 'All questions have been answered!');
            return prev;
          }
          loadQuestionDetails(questions[nextIndex].questionId);
          return nextIndex;
        });
      });
    };

    setupConnection();

    return () => {
      connection?.off('BuzzerPressed');
      connection?.off('BuzzerAlreadyPressed');
      connection?.off('ResetBuzzer');
      connection?.off('MoveToNextQuestion');
      connection?.stop();
    };
  }, [questions]);

  const loadQuestionDetails = async questionId => {
    try {
      setLoading(true);
      const qRes = await fetch(
        `${Config.BASE_URL}/api/Questions/GetQuestionById/${questionId}`,
      );
      const qData = await qRes.json();

      if (qData.type === 2) {
        const optRes = await fetch(
          `${Config.BASE_URL}/api/QuestionOption/GetOptionsByQuestionId?questionId=${questionId}`,
        );
        const options = await optRes.json();
        setQuestion({...qData, options});
      } else {
        setQuestion(qData);
      }

      setFirstPressed(null);
      setAnswerText('');
      setSelectedOption(null);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch question details');
    } finally {
      setLoading(false);
    }
  };

  const pressBuzzer = async () => {
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        const questionId = questions[currentQuestionIndex]?.questionId;
        if (!questionId) {
          Alert.alert('Error', 'No questions available');
          return;
        }
        await connection.invoke('PressBuzzer', userId, questionId);
      } catch (error) {
        Alert.alert('Error', error.toString());
      }
    } else {
      Alert.alert('Error', 'SignalR not connected');
    }
  };

  const moveToNextQuestion = async () => {
    if (connection?.state === signalR.HubConnectionState.Connected) {
      try {
        await connection.invoke('MoveToNextQuestion');
      } catch (error) {
        Alert.alert('Error', error.toString());
      }
    }
  };

  const handleOptionSelect = optionId => {
    setSelectedOption(optionId);
  };

  const submitAnswer = async () => {
    if (!question) return;

    try {
      setIsSubmitting(true);

      let answerData;
      if (question.type === 1) {
        if (!answerText.trim()) {
          Alert.alert('Error', 'Please enter your answer');
          return;
        }
        answerData = {
          userId: firstPressed,
          questionId: question.id,
          answerText,
        };
      } else if (question.type === 2) {
        if (selectedOption === null) {
          Alert.alert('Error', 'Please select an option');
          return;
        }
        answerData = {
          userId: firstPressed,
          questionId: question.id,
          selectedOptionId: selectedOption,
        };
      }

      Alert.alert('Success', 'Answer submitted successfully!');

      if (connection?.state === signalR.HubConnectionState.Connected) {
        await connection.invoke('ResetBuzzer');
      }
      setFirstPressed(null);
      await moveToNextQuestion();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Status: {status}</Text>
        <Text style={styles.headerText}>
          Question: {currentQuestionIndex + 1} of {questions.length}
        </Text>
      </View>

      {loading || !question ? (
        <ActivityIndicator size="large" color="#FFD700" />
      ) : (
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.text}</Text>
        </View>
      )}

      <View style={styles.content}>
        {firstPressed === null ? (
          // Buzzer not pressed state
          <View style={styles.buzzerContainer}>
            <Text style={styles.instructionText}>
              Press the buzzer when you know the answer!
            </Text>
            <TouchableOpacity onPress={pressBuzzer} style={styles.buzzerButton}>
              <Text style={styles.buttonText}>PRESS BUZZER</Text>
            </TouchableOpacity>
          </View>
        ) : firstPressed === userId ? (
          // User pressed first state
          <View style={styles.answerContainer}>
            <Text style={styles.successText}>You pressed first!</Text>
            <Text style={styles.instructionText}>Submit your answer:</Text>

            {question?.type === 2 ? (
              <View style={styles.optionsContainer}>
                {question.options?.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionButton,
                      selectedOption === opt.id && styles.selectedOption,
                    ]}
                    onPress={() => handleOptionSelect(opt.id)}>
                    <Text style={styles.optionText}>{opt.option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Your answer"
                placeholderTextColor="#aaa"
                value={answerText}
                onChangeText={setAnswerText}
              />
            )}

            <TouchableOpacity
              onPress={submitAnswer}
              style={styles.submitButton}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text style={styles.submitText}>SUBMIT ANSWER</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Someone else pressed first state
          <View style={styles.waitingContainer}>
            <Text style={styles.infoText}>
              User {firstPressed} pressed first!
            </Text>
            <Text style={styles.waitingText}>Waiting for next question...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 10,
  },
  header: {
    padding: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    color: '#FFD700',
    fontSize: 16,
  },
  questionContainer: {
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 15,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  buzzerContainer: {
    alignItems: 'center',
  },
  answerContainer: {
    padding: 15,
  },
  waitingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    color: '#FF5722',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  waitingText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
  },
  buzzerButton: {
    padding: 20,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 20,
  },
  optionsContainer: {
    marginVertical: 15,
  },
  optionButton: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  optionText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 15,
    marginVertical: 15,
    backgroundColor: '#222',
    color: '#FFD700',
    fontSize: 16,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
