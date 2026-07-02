import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Modal,
    Image,
    Linking
} from 'react-native';
import { useAppState } from '../hooks/useAppState';
import { NEWSPAPERS } from '../data';
import {
    Check,
    LogOut, CheckCircle, Info, Newspaper,
    Moon,
    Sun,
    User,
    Settings2,
    Mail,
} from 'lucide-react-native';
import { theme } from '../theme';
import CONSTANT from '../utility/constant';

export default function SettingsScreen() {
    const {
        profile,
        settings,
        updateProfile,
        toggleDarkMode,
        toggleNotifications,
        logout,
        backupData,
        restoreData,
        resetToDefaults,
        addSupportedNewspaper,
        toggleSupportedNewspaper
    } = useAppState();

    // Distributor Profile form local states
    const [businessName, setBusinessName] = useState(profile.businessName);
    const [ownerName, setOwnerName] = useState(profile.ownerName);
    const [phone, setPhone] = useState(profile.phone);
    const [address, setAddress] = useState(profile.address);
    const [newspaperInput, setNewspaperInput] = useState('');
    const [formNewspaper, setFormNewspaper] = useState('');
    const [addNewsPaperModalVisible, setAddNewsPaperModalVisible] = useState(false);
    const [showSupportedDropdown, setShowSupportedDropdown] = useState(false);

    // Operation indicators
    const [profileSavedToast, setProfileSavedToast] = useState(false);
    const [restoreText, setRestoreText] = useState('');

    // Handle Profile Save
    const handleSaveProfile = () => {
        if (!businessName.trim() || !ownerName.trim() || !phone.trim() || !address.trim()) {
            Alert.alert("Form Error", "All fields with an asterisk (*) are required.");
            return;
        }
        updateProfile({
            businessName: businessName.trim(),
            ownerName: ownerName.trim(),
            phone: phone,
            address: address.trim(),
            passPin: profile.passPin
        });
        setProfileSavedToast(true);
        setTimeout(() => setProfileSavedToast(false), 3000);
        Alert.alert("Profile Saved", "Distributor Business Profile details updated successfully!");
    };

    // Copy Backup JSON to Clipboard
    const handleCopyBackup = () => {
        const rawBackup = backupData();
        // Copy logic
        Alert.alert(
            "Backup Data Ready",
            "Copy this raw ledger data to preserve your logs:\n\n" + rawBackup.substring(0, 100) + "...\n\n(We highly recommend storing this string in a secure digital notebook.)",
            [{ text: "Awesome" }]
        );
    };

    // Restore Custom Backup JSON
    const handleRestoreBackup = () => {
        if (!restoreText.trim()) {
            Alert.alert("Input empty", "Please paste your ledger backup code before restoring.");
            return;
        }
        const success = restoreData(restoreText.trim());
        if (success) {
            setRestoreText('');
            Alert.alert("Database Restored", "Your newspaper distributor database has been synced successfully.");
        } else {
            Alert.alert("Restore Failed", "Could not parse JSON. Check the backup format and try again.");
        }
    };

    const handleEmailSupport = () => {
        const url = `mailto:${CONSTANT.SETTINGS_SCREEN.SUPPORT_EMAIL}?subject=${encodeURIComponent(`Technical Support - ${profile.businessName}`)}`;
        Linking.openURL(url).catch(() => {
            Alert.alert("Error", "Could not trigger email draft.");
        });
    };

    const isDark = settings.darkMode;
    const currentColors = isDark ? {
        card: theme.colors.darkCard,
        text: theme.colors.darkText,
        textLight: theme.colors.darkTextLight,
        border: theme.colors.darkBorder,
        inputBg: '#334155',
    } : {
        card: theme.colors.card,
        text: theme.colors.text,
        textLight: theme.colors.textLight,
        border: theme.colors.borderLight,
        inputBg: '#f8fafc',
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" id="settings-tab-root">

            {/* Title */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: currentColors.text }]}>Agency & App Settings</Text>
                <Text style={styles.subtitle}>Customize your distributor profile, toggle themes, and manage database back-ups</Text>
            </View>

            {profileSavedToast ? (
                <View style={styles.toastSuccess}>
                    <CheckCircle size={18} color="#10b981" />
                    <Text style={styles.toastSuccessText}>Profile information updated successfully!</Text>
                </View>
            ) : null}

            {/* Distributor business profile form Card */}
            <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                <View style={styles.cardHeaderRow}>
                    <User size={16} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: currentColors.text }]}>Distributor Business Profile</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Business Name *</Text>
                        <TextInput
                            id="settings-business-name"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            value={businessName}
                            onChangeText={setBusinessName}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Owner Name *</Text>
                        <TextInput
                            id="settings-owner-name"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            value={ownerName}
                            onChangeText={setOwnerName}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Agency Phone *</Text>
                        <TextInput
                            id="settings-owner-phone"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Office Address *</Text>
                        <TextInput
                            id="settings-owner-address"
                            style={[styles.formInput, styles.formTextArea, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            multiline
                            numberOfLines={2}
                            value={address}
                            onChangeText={setAddress}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.saveProfileBtn}
                        onPress={handleSaveProfile}
                        id="settings-save-profile-btn"
                    >
                        <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Supported Newspapers Section */}
            <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Newspaper size={16} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: currentColors.text }]}>Supported Newspapers</Text>
                </View>

                {/* <View style={styles.formContainer}>
					<TouchableOpacity
						style={styles.saveProfileBtn}
						onPress={() => setAddNewsPaperModalVisible(true)}
						id="add-newspaper-modal-btn"
					>
						<Text style={styles.saveProfileBtnText}>Add Newspaper</Text>
					</TouchableOpacity>
				</View> */}

                {/* Add Newspaper Modal */}
                <Modal
                    visible={!!addNewsPaperModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setAddNewsPaperModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Add New Newspaper</Text>
                            <TextInput
                                id="modal-newspaper-input"
                                style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                                placeholder="Newspaper name"
                                placeholderTextColor={theme.colors.textMuted}
                                value={newspaperInput}
                                onChangeText={setNewspaperInput}
                            />
                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity
                                    style={{ ...styles.saveProfileBtn, width: '40%' }}
                                    onPress={() => {
                                        addSupportedNewspaper(newspaperInput);
                                        setNewspaperInput('');
                                        setAddNewsPaperModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.saveProfileBtnText}>Add</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ ...styles.cancelBtn, width: '40%' }}
                                    onPress={() => setAddNewsPaperModalVisible(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Supported Newspapers Dropdown */}
                <View style={{ ...styles.formContainer, marginTop: 5 }}>
                    {/* <Text style={[{ ...styles.formLabel, fontWeight: 900 }]}>Select Supported Newspapers</Text> */}
                    <View style={styles.dropdownContent}>
                        <ScrollView nestedScrollEnabled={true}>
                            {(settings.allNewspapers && settings.allNewspapers.length > 0 ? settings.allNewspapers : NEWSPAPERS).map((newspaper) => (
                                <TouchableOpacity
                                    key={newspaper}
                                    style={styles.checkboxPill}
                                    onPress={() => toggleSupportedNewspaper(newspaper)}
                                >
                                    <Check size={14} color={settings?.supportedNewspapers?.includes(newspaper) ? '#10b981' : '#94a3b8'} />
                                    <Text style={styles.checkboxPillText}>{newspaper}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

            </View>
            {/* Preferences and Switch controls */}
            <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Settings2 size={16} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: currentColors.text }]}>Application Preferences</Text>
                </View>

                <View style={styles.preferenceRows}>
                    {/* Theme toggler */}
                    <View style={[styles.preferenceItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: currentColors.border }]}>
                        <View style={styles.preferenceMetaLeft}>
                            {isDark ? <Moon size={16} color="#eab308" /> : <Sun size={16} color="#f59e0b" />}
                            <View>
                                <Text style={[styles.prefTitleText, { color: currentColors.text }]}>Dark Mode Theme</Text>
                                <Text style={styles.prefSubtitleText}>Switch screen colors to dark</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggleSwitch, { backgroundColor: settings.darkMode ? '#0284c7' : '#94a3b8' }]}
                            onPress={toggleDarkMode}
                            id="dark-mode-toggle-btn"
                        >
                            <View style={[styles.toggleCircle, { transform: [{ translateX: settings.darkMode ? 18 : 0 }] }]} />
                        </TouchableOpacity>
                    </View>

                    {/* todo - nest release Notifications toggler */}
                    {/* <View style={[styles.preferenceItem, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: currentColors.border }]}>
						<View style={styles.preferenceMetaLeft}>
							<Bell size={16} color="#0284c7" />
							<View>
								<Text style={[styles.prefTitleText, { color: currentColors.text }]}>Push Billing Alerts</Text>
								<Text style={styles.prefSubtitleText}>Enable pending dues reminders</Text>
							</View>
						</View>
						<TouchableOpacity
							style={[styles.toggleSwitch, { backgroundColor: settings.notificationsEnabled ? '#0284c7' : '#94a3b8' }]}
							onPress={toggleNotifications}
							id="notifications-toggle-btn"
						>
							<View style={[styles.toggleCircle, { transform: [{ translateX: settings.notificationsEnabled ? 18 : 0 }] }]} />
						</TouchableOpacity>
					</View> */}
                </View>
            </View>

            {/* todo - nest release Backup and restore engine Card */}
            {/* <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
				<View style={styles.cardHeaderRow}>
					<Database size={16} color={theme.colors.primary} />
					<Text style={[styles.cardTitle, { color: currentColors.text }]}>Offline Backup Engine</Text>
				</View>

				<View style={styles.backupActionsContainer}>
					<TouchableOpacity
						style={[styles.backupActionBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
						onPress={handleCopyBackup}
						id="backup-data-btn"
					>
						<Download size={18} color="#0284c7" />
						<Text style={[styles.backupActionBtnText, { color: currentColors.text }]}>Generate Backup Logs</Text>
					</TouchableOpacity>

					<View style={styles.restoreForm}>
						<Text style={styles.restoreLabel}>Paste Backup Code to Restore</Text>
						<TextInput
							id="restore-textarea"
							style={[styles.restoreInput, { color: currentColors.text, backgroundColor: isDark ? '#111827' : '#f1f5f9' }]}
							placeholder="Paste your backup JSON object here..."
							placeholderTextColor="#94a3b8"
							multiline
							numberOfLines={2}
							value={restoreText}
							onChangeText={setRestoreText}
						/>


						<TouchableOpacity
							style={styles.restoreSubmitBtn}
							onPress={handleRestoreBackup}
							id="restore-data-btn"
						>
							<Text style={styles.restoreSubmitBtnText}>Restore Backup Code Now</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View> */}

            {/* Logout button row */}
            <View style={[styles.card, styles.logoutCardRow, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                <View style={styles.logoutLeft}>
                    <Text style={[styles.versionText, { color: currentColors.text }]}>Version {settings.appVersion}</Text>
                    <Text style={styles.metaLabelText}>{profile.businessName} • Offline PWA Ready</Text>
                </View>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                        Alert.alert("Logout Distributor", "Are you sure you want to log out?", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Log Out", style: "destructive", onPress: logout }
                        ]);
                    }}
                    id="settings-logout-btn"
                >
                    <LogOut size={14} color="#be123c" />
                    <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
            </View>

            {/* About Application attributes */}
            <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]} id="settings-about-section">
                <View style={styles.cardHeaderRow}>
                    <Info size={16} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: currentColors.text }]}>About Application</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 5 }}>
                    <View style={[{ flex: 1, gap: 5 }]}>
                        <Text style={[styles.aboutText, { color: currentColors.textLight }, styles.boldText]}>{CONSTANT.COMMON.COPYRIGHT} {CONSTANT.COMMON.COMPANY}</Text>
                        <Text style={[styles.aboutText, { color: currentColors.textLight }, styles.boldText]}>{CONSTANT.COMMON.RIGHTS_RESERVED}</Text>
                        <Text style={[styles.aboutText, { color: currentColors.textLight }, styles.boldText]}>{CONSTANT.COMMON.DEVELOPER}</Text>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 10, }}>
                        <Image
                            source={require('@/assets/icon.png')}
                            style={{ width: 100, height: 100 }}
                        />
                    </View>
                </View>

                <View style={[styles.supportBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: currentColors.border }]}>
                    <Text style={styles.supportLabel}>For Technical Support Contact</Text>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: 5 }}
                        onPress={handleEmailSupport}
                    >
                        <Image
                            source={require('@/assets/unnamed_blank.png')}
                            style={{ width: 20, height: 20 }}
                        />
                        <Text style={styles.supportEmail}>{CONSTANT.SETTINGS_SCREEN.SUPPORT_EMAIL}</Text>
                    </TouchableOpacity>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },
    header: {
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
    },
    subtitle: {
        fontSize: 10,
        color: '#94a3b8',
        marginTop: 2,
        fontWeight: '600',
        lineHeight: 14,
    },
    toastSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ecfdf5',
        borderWidth: 1,
        borderColor: '#a7f3d0',
        borderRadius: 14,
        padding: 12,
        gap: 8,
    },
    toastSuccessText: {
        fontSize: 11,
        color: '#047857',
        fontWeight: '700',
    },
    card: {
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '900',
    },
    formContainer: {
        gap: 12,
    },
    formField: {
        gap: 4,
    },
    formLabel: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        fontSize: 12,
        fontWeight: '600',
    },
    formTextArea: {
        height: 54,
        paddingTop: 8,
        textAlignVertical: 'top',
    },
    flexRowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    optionalLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#0284c7',
    },
    qrPreviewCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    qrPreviewImage: {
        width: 36,
        height: 36,
        borderRadius: 6,
    },
    qrPreviewTitle: {
        fontSize: 10,
        fontWeight: '800',
    },
    qrPreviewSubtitle: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: 1,
    },
    saveProfileBtn: {
        backgroundColor: '#0284c7',
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    saveProfileBtnText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
        color: '#111',
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    dropdownHeader: {
        backgroundColor: '#0284c7',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    dropdownContent: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        height: 150,
    },
    checkboxPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 6,
        backgroundColor: '#e5e7eb',
        borderRadius: 8,
    },
    checkboxPillText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#111',
    },
    cancelBtn: {
        backgroundColor: '#e5e7eb',
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    cancelBtnText: {
        color: '#111',
        fontSize: 11,
        fontWeight: '900',
    },
    preferenceRows: {
        gap: 10,
    },
    preferenceItem: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    preferenceMetaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    prefTitleText: {
        fontSize: 11,
        fontWeight: '800',
    },
    prefSubtitleText: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: 1,
    },
    toggleSwitch: {
        width: 42,
        height: 22,
        borderRadius: 11,
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ffffff',
    },
    backupActionsContainer: {
        gap: 14,
    },
    backupActionBtn: {
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    backupActionBtnText: {
        fontSize: 11,
        fontWeight: '800',
    },
    restoreForm: {
        gap: 8,
    },
    restoreLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    restoreInput: {
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        height: 52,
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    restoreSubmitBtn: {
        backgroundColor: '#e0f2fe',
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    restoreSubmitBtnText: {
        color: '#0284c7',
        fontSize: 11,
        fontWeight: '900',
    },
    resetContainer: {
        borderTopWidth: 1,
        paddingTop: 12,
        gap: 8,
    },
    resetLabel: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '600',
    },
    resetBtn: {
        backgroundColor: '#ffe4e6',
        borderWidth: 1,
        borderColor: '#fecdd3',
        height: 42,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    resetBtnText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '900',
    },
    newspaperPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    newspaperPillText: {
        fontSize: 11,
        fontWeight: '600',
    },
    aboutText: {
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '600',
    },
    boldText: {
        fontWeight: '800',
    },
    supportBox: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        marginTop: 10,
        gap: 2,
    },
    supportLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    supportEmail: {
        fontSize: 11,
        color: '#0284c7',
        fontWeight: '900',
    },
    logoutCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoutLeft: {
        gap: 2,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '900',
    },
    metaLabelText: {
        fontSize: 8,
        color: '#94a3b8',
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ffe4e6',
        borderWidth: 1,
        borderColor: '#fecdd3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    logoutBtnText: {
        color: '#be123c',
        fontSize: 10,
        fontWeight: '900',
    },
});
