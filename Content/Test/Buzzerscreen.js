import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import Config from '../Settings/Config';

export default function BuzzerScreenApi({route}) {
  // Get teamId and teamName from navigation params
  const {teamId = 1, teamName = 'Team 1'} = route.params || {};

  const [firstPressedTeam, setFirstPressedTeam] = useState(null);
  const [question, setQuestion] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);

  const competitionRoundId = 9;

  const resetBuzzer = async () => {
    try {
      await fetch(`${Config.BASE_URL}/api/buzzer/reset`, {
        method: 'POST',
      });
      setFirstPressedTeam(null);
      setAnswerText('');
      setSelectedOption(null);
    } catch (error) {
      Alert.alert('Error', error.toString());
    }
  };

  const checkBuzzerStatus = async () => {
    try {
      const response = await fetch(`${Config.BASE_URL}/api/buzzer/status/`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setFirstPressedTeam({
            id: data.teamId,
            name: data.teamName,
            pressTime: new Date(data.pressTime),
          });
        }
      }
    } catch (error) {
      console.error('Error checking buzzer status:', error);
    }
  };

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

    const interval = setInterval(checkBuzzerStatus, 1000);
    setPollingInterval(interval);

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [questions, currentQuestionIndex]);

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

      await resetBuzzer();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch question details');
    } finally {
      setLoading(false);
    }
  };

  const pressBuzzer = async () => {
    try {
      const questionId = questions[currentQuestionIndex]?.questionId;
      if (!questionId) {
        Alert.alert('Error', 'No questions available');
        return;
      }

      const response = await fetch(`${Config.BASE_URL}/api/buzzer/press`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: teamId,
          questionId: questionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFirstPressedTeam({
          id: teamId,
          name: teamName,
          pressTime: new Date(result.pressTime),
        });
      } else {
        Alert.alert(
          'Info',
          `${result.firstPressTeamName} already pressed first at ${new Date(
            result.pressTime,
          ).toLocaleTimeString()}`,
        );
      }
    } catch (error) {
      Alert.alert('Error', error.toString());
    }
  };

  const moveToNextQuestion = async () => {
    setCurrentQuestionIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= questions.length) {
        setShowReviewModal(true);
        return prev;
      }
      loadQuestionDetails(questions[nextIndex].questionId);
      return nextIndex;
    });
  };

  const handleOptionSelect = optionId => {
    setSelectedOption(optionId);
  };

  const submitAnswer = async () => {
    if (!question) return;

    try {
      setIsSubmitting(true);

      let answerToStore = {
        teamId: teamId,
        teamName: teamName,
        questionId: question.id,
        questionText: question.text,
        answer:
          question.type === 1
            ? answerText
            : question.options?.find(opt => opt.id === selectedOption)
                ?.option || 'Selected option',
      };

      setUserAnswers(prev => [...prev, answerToStore]);
      Alert.alert('Success', 'Answer submitted successfully!');
      await resetBuzzer();
      await moveToNextQuestion();
      setAnswerText('');

      if (currentQuestionIndex + 1 >= questions.length) {
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showReviewModal}
      onRequestClose={() => setShowReviewModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Your Answers Review</Text>
          <ScrollView>
            {userAnswers.map((answer, index) => (
              <View key={index} style={styles.answerItem}>
                <Text style={styles.questionReviewText}>
                  Q{index + 1}: {answer.questionText}
                </Text>
                <Text style={styles.teamReviewText}>
                  Team: {answer.teamName}
                </Text>
                <Text style={styles.answerReviewText}>
                  Answer: {answer.answer}
                </Text>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowReviewModal(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const isFirstPress = firstPressedTeam?.id === teamId;
  const isOtherTeamPressed = firstPressedTeam && !isFirstPress;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Status: {status}</Text>
        <Text style={styles.headerText}>
          Question: {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.teamHeader}>
          {teamName} (Team {teamId})
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
        {firstPressedTeam === null ? (
          <View style={styles.buzzerContainer}>
            <Text style={styles.instructionText}>
              Press the buzzer when you know the answer!
            </Text>
            <TouchableOpacity onPress={pressBuzzer} style={styles.buzzerButton}>
              <Text style={styles.buttonText}>PRESS BUZZER</Text>
            </TouchableOpacity>
          </View>
        ) : isFirstPress ? (
          <View style={styles.answerContainer}>
            <Text style={styles.successText}>{teamName} pressed first!</Text>
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
        ) : isOtherTeamPressed ? (
          <View style={styles.waitingContainer}>
            <Text style={styles.infoText}>
              {firstPressedTeam.name} pressed first!
            </Text>
            <Text style={styles.waitingText}>Waiting for next question...</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={resetBuzzer} style={styles.resetButton}>
        <Text style={styles.buttonText}>RESET BUZZER</Text>
      </TouchableOpacity>

      {renderReviewModal()}
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
  teamHeader: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
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
    marginVertical: 5,
  },
  resetButton: {
    padding: 15,
    backgroundColor: '#FF5733',
    borderRadius: 10,
    width: '80%',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  answerItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionReviewText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'left',
  },
  teamReviewText: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'left',
    fontWeight: 'bold',
  },
  answerReviewText: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'left',
  },
  closeButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
