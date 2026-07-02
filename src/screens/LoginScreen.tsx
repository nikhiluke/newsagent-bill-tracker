import React, { useState, useEffect } from 'react';
import { Keyboard, } from 'react-native';
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	KeyboardAvoidingView,
	Platform
} from 'react-native';
import { useAppState } from '../hooks/useAppState';
import { Phone, Lock, AlertCircle, Newspaper } from 'lucide-react-native';
import { theme } from '../theme';
import CONSTANT from '../utility/constant';

export default function LoginScreen() {
	const { login, profile } = useAppState();
	const [phone, setPhone] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [keyboardVisible, setKeyboardVisible] = useState(false);

	useEffect(() => {
		const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
		const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
		return () => {
			showListener.remove();
			hideListener.remove();
		};
	}, []);


	const handleSubmit = () => {
		if (!phone) {
			setError('Please enter your mobile number.');
			return;
		}

		if (!password) {
			setError('Please enter your 4-digit pass pin.');
			return;
		}
		const success = login(phone, password);
		if (!success) {
			setError('Invalid mobile number or pass pin.');
		}
	};

	return (
		<View style={styles.container}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={64}>
				<ScrollView
					contentContainerStyle={styles.scrollContainer}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.card} id="login-container-card">
						{/* Header Logo & Title */}
						<View style={styles.logoContainer}>
							<View style={styles.iconBox}>
								<Newspaper size={34} color="#ffffff" />
							</View>
							<Text style={styles.title} id="login-title">{profile?.businessName || CONSTANT.LOGIN_SCREEN.TITLE_SUFFIX}</Text>
							<Text style={styles.subtitle}>
								{CONSTANT.LOGIN_SCREEN.SUB_TITLE}
							</Text>
						</View>

						{/* Error Notification */}
						{error ? (
							<View style={styles.errorAlert} id="login-error-alert">
								<AlertCircle size={18} color={theme.colors.danger} style={styles.errorIcon} />
								<Text style={styles.errorText}>{error}</Text>
							</View>
						) : null}

						{/* Mobile Number Field */}
						<View style={styles.inputGroup}>
							<Text style={styles.label}>Mobile Number</Text>
							<View style={styles.inputWrapper}>
								<Phone size={18} color={theme.colors.textLight} style={styles.inputIcon} />
								<TextInput
									id="phone-input"
									style={styles.textInput}
									placeholder="Enter 10-digit number"
									placeholderTextColor={theme.colors.textMuted}
									keyboardType="phone-pad"
									maxLength={10}
									value={phone}
									onChangeText={(text) => {
										setPhone(text.replace(/\D/g, '').slice(0, 10));
										setError('');
									}}
								/>
							</View>
						</View>
						<View style={styles.inputGroup}>
							<View style={styles.labelRow}>
								<Text style={styles.label}>Security Password</Text>
							</View>
							<View style={styles.inputWrapper}>
								<Lock size={18} color={theme.colors.textLight} style={styles.inputIcon} />
								<TextInput
									id="password-input"
									style={styles.textInput}
									placeholder="Enter 4 digit pass pin"
									placeholderTextColor={theme.colors.textMuted}
									secureTextEntry
									value={password}
									keyboardType="number-pad"
									maxLength={4}
									onChangeText={(text) => {
										setPassword(text);
										setError('');
									}}
								/>
							</View>
						</View>

						{/* Sign In Button */}
						<TouchableOpacity
							style={styles.submitBtn}
							onPress={handleSubmit}
							activeOpacity={0.8}
							id="login-submit-btn"
						>
							<Text style={styles.submitBtnText}> Sign In Securely </Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
			{/* Fixed Footer – hidden when keyboard is visible */}
			{!keyboardVisible && (
				<View style={styles.footerContainer}>
					<Text style={styles.footer}>{CONSTANT.LOGIN_SCREEN.FOOTER_COPYRIGHT}</Text>
					<Text style={styles.footer}>{CONSTANT.LOGIN_SCREEN.FOOTER_DEVELOPER}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	scrollContainer: {
		flexGrow: 1,
		backgroundColor: '#f8fafc',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
	},
	card: {
		width: '100%',
		maxWidth: 380,
		backgroundColor: '#ffffff',
		borderRadius: 32,
		padding: 24,
		shadowColor: '#64748b',
		shadowOpacity: 0.1,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 4 },
		elevation: 3,
		borderWidth: 1,
		borderColor: '#f1f5f9',
	},
	logoContainer: {
		alignItems: 'center',
		marginBottom: 28,
	},
	iconBox: {
		width: 64,
		height: 64,
		backgroundColor: theme.colors.primary,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		shadowColor: '#0284c7',
		shadowOpacity: 0.25,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
	},
	title: {
		fontSize: 22,
		fontWeight: '900',
		color: theme.colors.text,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 11,
		color: theme.colors.textLight,
		textAlign: 'center',
		marginTop: 6,
		lineHeight: 16,
		fontWeight: '500',
	},
	errorAlert: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: theme.colors.dangerLight,
		borderColor: '#fecdd3',
		borderWidth: 1,
		borderRadius: 14,
		padding: 12,
		marginBottom: 20,
	},
	errorIcon: {
		marginRight: 8,
		marginTop: 1,
	},
	errorText: {
		flex: 1,
		fontSize: 11,
		color: theme.colors.dangerDark,
		fontWeight: '700',
	},
	inputGroup: {
		marginBottom: 16,
	},
	labelRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	label: {
		fontSize: 10,
		fontWeight: '800',
		color: theme.colors.textLight,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 6,
	},
	inputWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f8fafc',
		borderWidth: 1,
		borderColor: '#e2e8f0',
		borderRadius: 14,
		paddingHorizontal: 12,
		height: 48,
	},
	inputIcon: {
		marginRight: 10,
	},
	textInput: {
		flex: 1,
		fontSize: 13,
		color: theme.colors.text,
		fontWeight: '600',
		height: '100%',
		padding: 0,
	},
	submitBtn: {
		width: '100%',
		backgroundColor: theme.colors.primary,
		height: 52,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#0284c7',
		shadowOpacity: 0.25,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
		elevation: 4,
		marginTop: 8,
	},
	submitBtnText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '900',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	container: {
		flex: 1,
		position: 'relative',
		backgroundColor: '#f8fafc',
	},
	footerContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		paddingTop: 10,
		paddingBottom: 50,
	},
	footer: {
		fontSize: 10,
		color: theme.colors.textMuted,
		textAlign: 'center',
	},
});
