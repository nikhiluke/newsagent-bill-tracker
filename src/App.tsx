import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AgencyRegistrationScreen from './screens/AgencyRegistrationScreen';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useAppState } from './hooks/useAppState';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import CustomersScreen from './screens/CustomersScreen';
import LedgerScreen from './screens/LedgerScreen';
import SummaryScreen from './screens/SummaryScreen';
import SettingsScreen from './screens/SettingsScreen';
import {
  LayoutDashboard, Users, BookOpen, BarChart3, Settings as SettingsIcon,
} from 'lucide-react-native';
import { theme } from './theme';

function AppContent() {
  const { isLoggedIn, currentTab, navigateTo, settings, profile, initialize } = useAppState();
  console.log("profile", isLoggedIn, profile);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize();
    }
  }, []);
  const [timeStr, setTimeStr] = useState('07:28');

  // Sync real-time clock for top status bar simulation
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hrs = now.getHours();
      let mins = now.getMinutes();
      const hrsStr = hrs < 10 ? '0' + hrs : '' + hrs;
      const minsStr = mins < 10 ? '0' + mins : '' + mins;
      setTimeStr(`${hrsStr}:${minsStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!isLoggedIn && (!profile || !profile.businessName)) {
    return <AgencyRegistrationScreen />;
  }

  if (!isLoggedIn && (profile || profile.businessName)) {
    return <LoginScreen />;
  }

  const renderActiveTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'customers':
        return <CustomersScreen />;
      case 'ledger':
        return <LedgerScreen />;
      case 'reports':
        return <SummaryScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
    { id: 'reports', label: 'Summary', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ] as const;

  const isDark = settings.darkMode;
  const currentColors = isDark ? {
    bg: theme.colors.darkBackground,
    card: theme.colors.darkCard,
    text: theme.colors.darkText,
    border: theme.colors.darkBorder,
  } : {
    bg: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.borderLight,
  };

  const appShell = (
    <View style={[styles.shell, { backgroundColor: currentColors.bg }]}>
      {/* Navigation tabs positioned at top of app */}
      <View style={[styles.tabNavigation, { backgroundColor: currentColors.card, borderBottomColor: isDark ? '#1e293b' : '#bae6fd' }]}>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => navigateTo(item.id)}
              style={styles.tabButton}
            >
              <View style={[
                styles.tabIconContainer,
                isActive ? styles.tabIconContainerActive : null
              ]}>
                <IconComponent size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
              </View>
              <Text style={[
                styles.tabLabel,
                { color: isActive ? theme.colors.primary : '#94a3b8' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Screen Content View */}
      <View style={styles.contentViewport}>
        {renderActiveTabContent()}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.nativeContainer}>
      <StatusBar hidden={true} barStyle={isDark ? "light-content" : "dark-content"} />
      {appShell}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
  },
  shell: {
    flex: 1,
  },
  tabNavigation: {
    paddingTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: 48,
  },
  tabIconContainer: {
    padding: 6,
    borderRadius: 14,
  },
  tabIconContainerActive: {
    backgroundColor: '#0284c7',
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  contentViewport: {
    flex: 1,
  },
});

export default function App() {
  return <AppContent />;
}
