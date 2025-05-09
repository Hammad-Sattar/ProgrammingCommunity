import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import LoginScreen from '../Forms/Auhtentication/LoginPage';
import ExpertHome from '../Forms/Expert/ExpertHomeScreen';
import StudentHome from '../Forms/Student/StudentHomeScreen';
import AddQuestions from '../Forms/Expert/AddQuestion';
import AllQuestionscreen from '../Forms/Expert/AllQueston';
import AddSubjectExpertise from '../Forms/Expert/AddSubjectExpertise';
import AllCompetitionScreen from '../Forms/Expert/AllCompetition';
import CreateCompetitionScreen from '../Forms/Expert/CreateCompetition';
import UpdateCompetitionScreen from '../Forms/Expert/UpdateCompetition';
import ExpertSubjectScreen from '../Forms/Expert/ExpertSubject';
import CompetitionRoundScreen from '../Forms/Expert/AddCompetitonRound';
import CreateTaskScreen from '../Forms/Expert/CreateTask';
import TaskAttempScreen from '../Forms/Student/AttempTask';
import TaskAnswerScreen from '../Forms/Student/TaskQuestions';
import CompetitionScreen from '../Forms/Student/CompetitionScreen';
import RegisterTeamScreen from '../Forms/Student/MakeTeam';
import UnenrolledCompetitionsScreen from '../Forms/Student/UnenrolledCompetitions';
import EnrolledCompetitionsScreen from '../Forms/Student/EnrolledCompetitions';
import RoundsScreen from '../Forms/Student/CompetitonRounds';
import MCQScreen from '../Forms/Student/McqRound';
import SpeedProgrammingScreen from '../Forms/Student/SpeedProgrammingRound';
import ShuffleRoundScreen from '../Forms/Student/ShuffleRound';
import CheckTaskscreen from '../Forms/Expert/CheckTask';
import CheckAttemptedTaskQuestion from '../Forms/Expert/CheckAttemptedTaskQuestion';
import ExpertLeadearBoard from '../Forms/Expert/ExpertLeaderboard';
import ExpertLeadearBoardRoundScreen from '../Forms/Expert/ExpertLeaderBoardRounds';
import ExpertLeaderboardResultScreen from '../Forms/Expert/ExpertLeadearBoardResult';
import StudentLeadearBoard from '../Forms/Student/StudentLeaderBoard';
import StudentLeaderboardRoundScreen from '../Forms/Student/StudentLeaderBoardRounds';
import StudentLeaderboardResultScreen from '../Forms/Student/StudentLeaderBoardResult';

const Stack = createStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ExpertHome" component={ExpertHome} />
        <Stack.Screen name="StudentHome" component={StudentHome} />
        <Stack.Screen name="AllQuestions" component={AllQuestionscreen} />
        <Stack.Screen name="AddQuestions" component={AddQuestions} />
        <Stack.Screen
          name="UpdateCompetition"
          component={UpdateCompetitionScreen}
        />
        <Stack.Screen
          name="AddSubjectExpertise"
          component={AddSubjectExpertise}
        />
        <Stack.Screen name="AllCompetitions" component={AllCompetitionScreen} />
        <Stack.Screen
          name="CreateCompetitions"
          component={CreateCompetitionScreen}
        />

        <Stack.Screen name="ExpertSubject" component={ExpertSubjectScreen} />
        <Stack.Screen
          name="CompetitionRound"
          component={CompetitionRoundScreen}
        />

        <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
        <Stack.Screen name="AttempTask" component={TaskAttempScreen} />
        <Stack.Screen name="TaskAnswerScreen" component={TaskAnswerScreen} />
        <Stack.Screen name="CompetitionScreen" component={CompetitionScreen} />
        <Stack.Screen name="RegisterTeam" component={RegisterTeamScreen} />
        <Stack.Screen
          name="UnenrolledCompetitions"
          component={UnenrolledCompetitionsScreen}
        />
        <Stack.Screen
          name="EnrolledCompetitions"
          component={EnrolledCompetitionsScreen}
        />
        <Stack.Screen name="RoundsScreen" component={RoundsScreen} />
        <Stack.Screen name="MCQScreen" component={MCQScreen} />
        <Stack.Screen
          name="SpeedProgrammingScreen"
          component={SpeedProgrammingScreen}
        />
        <Stack.Screen name="ShuffleScreen" component={ShuffleRoundScreen} />
        <Stack.Screen name="CheckTask" component={CheckTaskscreen} />
        <Stack.Screen
          name="CheckAttemptedTaskQuestion"
          component={CheckAttemptedTaskQuestion}
        />
        <Stack.Screen
          name="ExpertLeadearBoard"
          component={ExpertLeadearBoard}
        />
        <Stack.Screen
          name="ExpertLeaderboardRound"
          component={ExpertLeadearBoardRoundScreen}
        />
        <Stack.Screen
          name="ExpertLeaderboardResult"
          component={ExpertLeaderboardResultScreen}
        />
        <Stack.Screen
          name="StudentLeadearBoard"
          component={StudentLeadearBoard}
        />
        <Stack.Screen
          name="StudentLeaderboardRound"
          component={StudentLeaderboardRoundScreen}
        />
        <Stack.Screen
          name="StudentLeaderboardResult"
          component={StudentLeaderboardResultScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
