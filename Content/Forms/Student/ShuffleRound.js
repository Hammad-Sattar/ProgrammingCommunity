import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  UIManager,
  PanResponder,
} from 'react-native';
import Config from '../../Settings/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRoute, useNavigation} from '@react-navigation/native';

const ShuffleRoundScreen = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [correct, setCorrect] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmit, setShowSubmit] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [isQualified, setIsQualified] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [questionOutputs, setQuestionOutputs] = useState({});
  const [showOutput, setShowOutput] = useState(false);
  const [activeTileIndex, setActiveTileIndex] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const competitionRoundId = route.params?.roundId ?? 1;

  useEffect(() => {
    const fetchTeamId = async () => {
      const savedTeamId = await AsyncStorage.getItem('teamId');
      if (savedTeamId) setTeamId(savedTeamId);
      else Alert.alert('Error', 'Team ID not found.');
    };

    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    fetchTeamId();
  }, []);

  useEffect(() => {
    if (teamId && competitionRoundId) {
      loadQualificationStatus();
    }
  }, [teamId, competitionRoundId]);

  const loadQualificationStatus = async () => {
    try {
      const roundCheckRes = await fetch(
        `${Config.BASE_URL}/api/CompetitionRound/IsFirstRound/${competitionRoundId}`,
      );
      const isFirstRound = await roundCheckRes.json();

      if (isFirstRound === true) {
        setIsQualified(true);
        loadQuestions();
        return;
      }

      const response = await fetch(
        `${
          Config.BASE_URL
        }/api/RoundResult/CheckQualificationStatus/${teamId}/${
          competitionRoundId - 1
        }`,
      );
      const data = await response.json();

      if (data.isQualified) {
        setIsQualified(true);
        loadQuestions();
      } else {
        setIsQualified(false);
        Alert.alert(
          'Qualification Status',
          'Sorry, you did not qualify for the previous round.',
          [{text: 'OK'}],
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to check qualification status.');
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    const compId = await AsyncStorage.getItem('competitionId');
    if (!compId) {
      Alert.alert('Error', 'Competition ID not found.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${Config.BASE_URL}/api/CompetitionRoundQuestion/GetCompetitionRoundQuestion?competitionRoundId=${competitionRoundId}`,
      );
      const list = await res.json();
      const loaded = await Promise.all(
        list.map(async q => {
          const qr = await fetch(
            `${Config.BASE_URL}/api/Questions/GetQuestionById/${q.questionId}`,
          );
          const qd = await qr.json();
          return qd.type === 3 ? qd : null;
        }),
      );
      const valid = loaded.filter(x => x);
      setQuestions(valid);

      const outputs = {};
      for (const question of valid) {
        const outputRes = await fetch(
          `${Config.BASE_URL}/api/Questions/GetQuestionOutput/${question.id}`,
        );
        const outputData = await outputRes.json();
        outputs[question.id] = outputData.output;
      }
      setQuestionOutputs(outputs);

      if (valid.length) {
        prepare(valid[0].text);
        if (valid.length === 1) setShowSubmit(true);
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch questions.');
    } finally {
      setLoading(false);
    }
  };

  const prepare = text => {
    const parts = text
      .split('//n')
      .map((ln, i) => ({key: String(i), text: ln.trim()}))
      .filter(p => p.text.length > 0);
    setCorrect(parts);
    setTiles([...parts].sort(() => Math.random() - 0.5));
  };

  const createPanResponder = index => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const hoverIndex = Math.floor((gestureState.moveY - 100) / 60);
        if (
          hoverIndex >= 0 &&
          hoverIndex < tiles.length &&
          hoverIndex !== index
        ) {
          const newTiles = [...tiles];
          const movedTile = newTiles[index];
          newTiles.splice(index, 1);
          newTiles.splice(hoverIndex, 0, movedTile);
          setTiles(newTiles);
          setActiveTileIndex(hoverIndex);
        }
      },
      onPanResponderRelease: () => {
        setActiveTileIndex(null);
      },
    });
  };

  const saveCurrent = () => {
    const q = questions[currentIndex];
    const answerText = tiles.map(t => t.text).join('\n');
    const correctText = correct.map(t => t.text).join('\n');
    const isCorrect = answerText === correctText;
    const newAnswer = {
      questionId: q.id,
      answer: answerText,
      isCorrect,
      marks: q.marks,
    };
    setAnswers(prev => [...prev.filter(a => a.questionId !== q.id), newAnswer]);
    return newAnswer;
  };

  const onNext = () => {
    saveCurrent();
    const ni = currentIndex + 1;
    if (ni < questions.length) {
      setCurrentIndex(ni);
      prepare(questions[ni].text);
      setShowSubmit(ni === questions.length - 1);
      setShowOutput(false);
    }
  };

  const onPrev = () => {
    saveCurrent();
    const pi = currentIndex - 1;
    if (pi >= 0) {
      setCurrentIndex(pi);
      prepare(questions[pi].text);
      setShowSubmit(pi === questions.length - 1);
      setShowOutput(false);
    }
  };

  const toggleOutput = () => {
    setShowOutput(!showOutput);
  };

  const onFinalSubmit = () => {
    Alert.alert(
      'Confirm Submission',
      'Are you sure you want to submit your answers?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit',
          onPress: async () => {
            const last = saveCurrent();
            const updated = [
              ...answers.filter(a => a.questionId !== last.questionId),
              last,
            ];
            const compId = await AsyncStorage.getItem('competitionId');
            const payload = updated.map(a => ({
              competitionId: compId,
              competitionRoundId,
              questionId: a.questionId,
              teamId: teamId,
              answer: a.answer,
              score: a.isCorrect ? a.marks : 0,
              submissionTime: new Date().toISOString(),
            }));

            try {
              const res = await fetch(
                `${Config.BASE_URL}/api/CompetitionAttemptedQuestion/AddCompetitionAttemptedQuestion`,
                {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(payload),
                },
              );

              if (res.ok) {
                setReviewMode(true);
                await fetch(
                  `${Config.BASE_URL}/api/RoundResult/insertroundresults`,
                  {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                  },
                );
              } else {
                Alert.alert('Error', 'Submission failed');
              }
            } catch {
              Alert.alert('Error', 'Failed to submit');
            }
          },
        },
      ],
    );
  };

  if (loading || isQualified === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isQualified) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>
          You did not qualify for the previous round.
        </Text>
      </View>
    );
  }

  if (reviewMode) {
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const obtainedMarks = answers.reduce(
      (sum, a) => sum + (a.isCorrect ? a.marks : 0),
      0,
    );
    const qualificationStatus =
      obtainedMarks >= totalMarks * 0.5 ? 'Qualified' : 'Not Qualified';

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.header}>📝 Review Your Answers</Text>
        {answers.map(a => {
          const q = questions.find(x => x.id === a.questionId);
          const codeLines = q.text.split('//n').filter(l => l.trim());
          return (
            <View key={q.id} style={styles.reviewBox}>
              <Text style={styles.questionLabel}>
                Question ({q.marks} marks)
              </Text>
              <Text style={styles.questionLabel}>Original Code:</Text>
              {codeLines.map((l, i) => (
                <Text key={i} style={styles.codeLine}>
                  {l.trim()}
                </Text>
              ))}
              <Text style={styles.questionLabel}>Your Arrangement:</Text>
              {a.answer.split('\n').map((l, i) => (
                <Text key={i} style={styles.codeLine}>
                  {l}
                </Text>
              ))}
              <Text
                style={[
                  styles.answerStatus,
                  a.isCorrect ? styles.correctAnswer : styles.wrongAnswer,
                ]}>
                {a.isCorrect
                  ? `✓ Correct (${q.marks}/${q.marks})`
                  : `✗ Incorrect (0/${q.marks})`}
              </Text>
              {!a.isCorrect && (
                <TouchableOpacity style={styles.challengeButton}>
                  <Text style={styles.challengeButtonText}>
                    Challenge This Answer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <View style={styles.scoreSummary}>
          <Text style={styles.summaryText}>
            Obtained Marks: {obtainedMarks}/{totalMarks}
          </Text>
          <Text style={styles.summaryText}>
            Qualification Status: {qualificationStatus}
          </Text>
        </View>
      </ScrollView>
    );
  }

  const q = questions[currentIndex];
  const currentOutput = q ? questionOutputs[q.id] : '';

  return (
    <ScrollView style={styles.container}>
      {q && (
        <>
          <Text style={styles.header}>
            Shuffle Round — Q{currentIndex + 1}/{questions.length} ({q.marks}{' '}
            marks)
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {width: `${((currentIndex + 1) / questions.length) * 100}%`},
              ]}
            />
          </View>
          <Text style={styles.instruction}>Drag and drop to reorder lines</Text>
          <TouchableOpacity
            style={styles.outputToggleButton}
            onPress={toggleOutput}>
            <Text style={styles.outputToggleButtonText}>
              {showOutput ? 'Hide Expected Output' : 'Show Expected Output'}
            </Text>
          </TouchableOpacity>
          {showOutput && currentOutput && (
            <View style={styles.outputContainer}>
              <Text style={styles.outputLabel}>Expected Output:</Text>
              {currentOutput.split('\\n').map((line, idx) => (
                <Text key={idx} style={styles.outputText}>
                  {line}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.tilesContainer}>
            {tiles.map((tile, index) => {
              const panResponder = createPanResponder(index);
              return (
                <View
                  key={tile.key}
                  style={[
                    styles.tile,
                    activeTileIndex === index && styles.activeTile,
                  ]}
                  {...panResponder.panHandlers}>
                  <Text style={styles.tileText}>{tile.text}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.footer}>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.btn} onPress={onPrev}>
                <Text style={styles.btnText}>Prev</Text>
              </TouchableOpacity>
            )}
            {showSubmit ? (
              <TouchableOpacity style={styles.btn} onPress={onFinalSubmit}>
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btn} onPress={onNext}>
                <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212', padding: 16},
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  header: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#FFD700',
  },
  instruction: {color: '#fff', marginBottom: 12},
  tilesContainer: {
    marginBottom: 16,
  },
  tile: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  activeTile: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FFD700',
  },
  tileText: {color: '#fff', fontSize: 16},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  btn: {
    flex: 1,
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  btnText: {color: '#121212', textAlign: 'center', fontSize: 16},
  reviewBox: {
    backgroundColor: '#222',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  codeLine: {
    fontFamily: 'Courier New',
    color: '#fff',
    marginVertical: 2,
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 4,
  },
  answerStatus: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  correctAnswer: {
    color: '#4CAF50',
  },
  wrongAnswer: {
    color: '#F44336',
  },
  challengeButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  challengeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scoreSummary: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    margin: 16,
    alignItems: 'center',
  },
  summaryText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  outputToggleButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  outputToggleButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  outputContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFD70055',
  },
  outputLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  outputText: {
    color: '#fff',
    fontFamily: 'Courier New',
  },
});

export default ShuffleRoundScreen;
