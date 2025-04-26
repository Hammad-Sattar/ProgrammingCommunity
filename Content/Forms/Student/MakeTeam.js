import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Config from '../../Settings/Config';
import {useRoute, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RegisterTeamScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {competitionId} = route.params;

  // Animation states
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideUpAnim = useState(new Animated.Value(30))[0];
  const [scrollY] = useState(new Animated.Value(0));

  // Component states
  const [teamName, setTeamName] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeamRegistered, setIsTeamRegistered] = useState(false);
  const [teamId, setTeamId] = useState(null);
  const [addedUsers, setAddedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    fetchStudents();
  }, []);
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          s =>
            s.firstname.toLowerCase().includes(q) ||
            s.lastname.toLowerCase().includes(q),
        ),
      );
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${Config.BASE_URL}/api/User/GetAllStudents`,
      );
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!teamName.trim()) {
      shakeAnimation();
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const teamResponse = await fetch(`${Config.BASE_URL}/api/team/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({teamName, userId}),
      });

      if (!teamResponse.ok) throw new Error(await teamResponse.text());

      const team = await teamResponse.json();
      setTeamId(team.teamId);
      setIsTeamRegistered(true);
      setAddedUsers([userId]); // Auto-add the creator to team

      Alert.alert('Success', 'Team registered successfully');
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to register team');
    }
  };

  const shakeAnimation = () => {
    const shake = new Animated.Value(0);
    Animated.sequence([
      Animated.timing(shake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shake, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
    return shake;
  };

  const handleAddToTeam = async userId => {
    if (!teamId) {
      Alert.alert('Error', 'Register team first');
      return;
    }

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/TeamMember/register`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({teamId, userId}),
        },
      );

      if (!response.ok) throw new Error(await response.text());

      setAddedUsers(prev => [...prev, userId]);
    } catch (error) {
      console.error('Add to Team error:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    }
  };

  const handleRegisterToCompetition = async () => {
    if (addedUsers.length === 0) {
      Alert.alert('Error', 'Add team members first');
      return;
    }

    try {
      const response = await fetch(
        `${Config.BASE_URL}/api/CompetitionTeam/AddCompetitionTeam`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({competitionId, teamId}),
        },
      );

      if (!response.ok) throw new Error(await response.text());

      Alert.alert('Success', 'Team registered for competition!', [
        {text: 'OK', onPress: () => navigation.navigate('CompetitionScreen')},
      ]);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Registration failed');
    }
  };

  const renderStudent = ({item, index}) => {
    const isAdded = addedUsers.includes(item.id);
    const inputRange = [-1, 0, 100 * index, 100 * (index + 2)];
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0],
    });
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.9],
    });

    return (
      <Animated.View
        style={[styles.studentItem, {opacity, transform: [{scale}]}]}>
        <View style={styles.studentHeader}>
          <Text style={styles.studentName}>
            {item.firstname} {item.lastname}
          </Text>
          <Icon
            name={isAdded ? 'check-circle' : 'person-add'}
            size={24}
            color={isAdded ? '#4CAF50' : '#FFD700'}
          />
        </View>

        <View style={styles.studentDetails}>
          <Text style={styles.studentInfo} numberOfLines={1}>
            <Icon name="email" size={14} color="#aaa" /> {item.email}
          </Text>
          <Text style={styles.studentInfo}>
            <Icon name="phone" size={14} color="#aaa" /> {item.phonenum}
          </Text>
          <Text style={styles.studentInfo}>
            <Icon name="badge" size={14} color="#aaa" /> {item.regNum}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, isAdded && styles.addButtonDisabled]}
          onPress={() => !isAdded && handleAddToTeam(item.id)}
          disabled={isAdded}>
          <Text style={styles.addButtonText}>
            {isAdded ? 'Added' : 'Add to Team'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}>
        <Animated.View
          style={[
            styles.headerContainer,
            {opacity: fadeAnim, transform: [{translateY: slideUpAnim}]},
          ]}>
          <Text style={styles.header}>🏆 Register Your Team</Text>
          <Text style={styles.subHeader}>Competition ID: {competitionId}</Text>
        </Animated.View>

        <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
          <Text style={styles.label}>Team Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter team name"
            placeholderTextColor="#888"
            value={teamName}
            onChangeText={setTeamName}
          />

          <TouchableOpacity
            style={[styles.button, isTeamRegistered && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isTeamRegistered}>
            <Text style={styles.buttonText}>
              {isTeamRegistered ? '✓ Team Registered' : 'Register Team'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isTeamRegistered && (
          <Animated.View style={[styles.card, {opacity: fadeAnim}]}>
            <Text style={styles.label}>Search Team Members</Text>
            <View style={styles.searchContainer}>
              <Icon
                name="search"
                size={20}
                color="#888"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#FFD700" />
            ) : (
              <FlatList
                data={filteredStudents}
                keyExtractor={item => item.id.toString()}
                renderItem={renderStudent}
                scrollEnabled={false}
                contentContainerStyle={styles.listContainer}
              />
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.registerButton,
                addedUsers.length === 0 && styles.buttonDisabled,
              ]}
              onPress={handleRegisterToCompetition}
              disabled={addedUsers.length === 0}>
              <Text style={styles.buttonText}>Register for Competition</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  subHeader: {
    color: '#888',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    color: '#FFD700',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#252525',
    color: '#FFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    padding: 15,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentItem: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  studentDetails: {
    marginBottom: 10,
  },
  studentInfo: {
    color: '#AAA',
    fontSize: 14,
    marginVertical: 3,
  },
  addButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#333',
  },
  addButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 10,
  },
});

export default RegisterTeamScreen;
