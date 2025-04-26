import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Config from '../../Settings/Config';

const RegistrationScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    phonenum: '',
    role: '',
    section: '',
    semester: '',
    campusName: '',
  });

  const handleInputChange = (name, value) => {
    setFormData({...formData, [name]: value});
  };

  const validateForm = () => {
    // Basic email regex for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email.');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      Alert.alert(
        'Validation Error',
        'Password must be at least 6 characters long.',
      );
      return false;
    }
    if (!formData.firstname.trim()) {
      Alert.alert('Validation Error', 'Please enter your first name.');
      return false;
    }
    if (!formData.lastname.trim()) {
      Alert.alert('Validation Error', 'Please enter your last name.');
      return false;
    }
    if (!formData.phonenum.trim() || formData.phonenum.length < 10) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid phone number (at least 10 digits).',
      );
      return false;
    }
    if (!formData.role) {
      Alert.alert('Validation Error', 'Please select a role.');
      return false;
    }
    if (formData.role === '3') {
      if (!formData.section.trim()) {
        Alert.alert('Validation Error', 'Please enter your section.');
        return false;
      }
      if (!formData.semester.trim()) {
        Alert.alert('Validation Error', 'Please enter your semester.');
        return false;
      }
    }
    if (formData.role === '4' && !formData.campusName.trim()) {
      Alert.alert('Validation Error', 'Please enter your campus name.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const requestData = {
      id: 0,
      password: formData.password,
      role: formData.role,
      regNum: formData.role === '3' ? formData.regNum : null,
      section: formData.role === '3' ? formData.section : null,
      semester: formData.role === '3' ? formData.semester : null,
      email: formData.email,
      phonenum: formData.phonenum,
      firstname: formData.firstname,
      lastname: formData.lastname,
      campusName: formData.role === '4' ? formData.campusName : null,
    };

    console.log('Request Payload:', JSON.stringify(requestData, null, 2));

    try {
      const response = await fetch(`${Config.BASE_URL}/api/User/RegisterUser`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestData),
      });
      const text = await response.text();
      console.log('Raw API Response:', text);

      if (response.ok) {
        try {
          const result = JSON.parse(text);
          Alert.alert(
            'Success',
            result.message || 'User registered successfully!',
            [{text: 'OK', onPress: () => resetForm()}],
          );
        } catch (jsonError) {
          Alert.alert('Success', text, [
            {text: 'OK', onPress: () => resetForm()},
          ]);
        }
      } else {
        Alert.alert('Error', text || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstname: '',
      lastname: '',
      phonenum: '',
      role: '',
      section: '',
      semester: '',
      campusName: '',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registration</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={value => handleInputChange('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
          placeholderTextColor="#AAA"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={formData.password}
          onChangeText={value => handleInputChange('password', value)}
          placeholder="Enter your password"
          secureTextEntry
          placeholderTextColor="#AAA"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          value={formData.firstname}
          onChangeText={value => handleInputChange('firstname', value)}
          placeholder="Enter your first name"
          placeholderTextColor="#AAA"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          value={formData.lastname}
          onChangeText={value => handleInputChange('lastname', value)}
          placeholder="Enter your last name"
          placeholderTextColor="#AAA"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={formData.phonenum}
          onChangeText={value => handleInputChange('phonenum', value)}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          placeholderTextColor="#AAA"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Role</Text>
        <RNPickerSelect
          onValueChange={value => handleInputChange('role', value)}
          value={formData.role}
          style={{
            inputAndroid: {...styles.input, height: 50},
            inputIOS: {...styles.input, height: 50},
            placeholder: {color: '#AAA'},
          }}
          placeholder={{label: 'Select Role...', value: null}}
          items={[
            {label: 'Admin', value: '1'},
            {label: 'Expert', value: '2'},
            {label: 'Campus Student', value: '3'},
            {label: 'Inter Campus Student', value: '4'},
          ]}
        />
      </View>

      {formData.role === '3' && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Section</Text>
            <TextInput
              style={styles.input}
              value={formData.section}
              onChangeText={value => handleInputChange('section', value)}
              placeholder="Enter your section"
              placeholderTextColor="#AAA"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Semester</Text>
            <TextInput
              style={styles.input}
              value={formData.semester}
              onChangeText={value => handleInputChange('semester', value)}
              placeholder="Enter your semester"
              placeholderTextColor="#AAA"
            />
          </View>
        </>
      )}

      {formData.role === '4' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Campus Name</Text>
          <TextInput
            style={styles.input}
            value={formData.campusName}
            onChangeText={value => handleInputChange('campusName', value)}
            placeholder="Enter your campus name"
            placeholderTextColor="#AAA"
          />
        </View>
      )}

      <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: '5%',
    backgroundColor: '#000',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFD700',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#FFD700',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#333',
    color: '#FFF',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default RegistrationScreen;
