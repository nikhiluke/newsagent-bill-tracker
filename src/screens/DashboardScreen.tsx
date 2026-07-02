import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { useAppState } from '../hooks/useAppState';
import { getDashboardStats, calculateCustomerOutstanding, getCustomerStatusForMonth, getCurrentMonth, getCurrentYear, getActiveCustomer } from '../utility';
import { 
  Clock, Search,UserPlus, CreditCard, ChevronRight 
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

export default function DashboardScreen() {
  const {
    profile, 
    customers, 
    payments, 
    openAddCustomer, 
    openPaymentEntry, 
    viewCustomerDetails,
    navigateTo,
    settings
  } = useAppState();

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [searchQuery, setSearchQuery] = useState('');

  const stats = getDashboardStats(customers, payments, selectedMonth, selectedYear);

  // Search filter
  const filteredSearchCustomers = searchQuery.trim() === '' 
    ? [] 
    : customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      ).slice(0, 5);

  // Recent payments
  const recentPaymentsList = [...payments]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 5);

  // Pending customers
  const activeCustomers = getActiveCustomer(customers, selectedMonth, selectedYear);
  const activePendingCustomers = activeCustomers
    .map(c => {
      const monthStatus = getCustomerStatusForMonth(c, selectedMonth, selectedYear, payments);
      const outstanding = calculateCustomerOutstanding(c, payments);
      return {
        customer: c,
        status: monthStatus,
        totalOutstanding: outstanding.totalOutstanding
      };
    })
    .filter(item => item.status.status !== 'Paid')
    .slice(0, 4);

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
    inputBg: '#f1f5f9',
  };

  // SVG Gauge parameters
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const collectionPercentage = stats.collectionPercentage;
  const strokeDashoffset = circumference - (collectionPercentage / 100) * circumference;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      
      {/* Header Info Block */}
      <View style={[styles.headerCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={[styles.headerTitle, { color: currentColors.text }]}>{profile.ownerName}</Text>
          </View>

          {/* Month/Year selector buttons (styled like responsive badge pills) */}
          <View style={styles.selectorRow}>
            <View style={[styles.pillBadge, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff' }]}>
              <Text style={styles.pillText}>{selectedMonth}</Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff' }]}>
              <Text style={styles.pillText}>{selectedYear}</Text>
            </View>
          </View>
        </View>

        {/* Live Search Input */}
        <View style={[styles.searchWrapper, { backgroundColor: currentColors.inputBg }]}>
          <Search size={18} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            id="dashboard-search-input"
            style={[styles.searchInput, { color: currentColors.text }]}
            placeholder="Search customer by name or phone..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search Dropdown Panel */}
        {filteredSearchCustomers.length > 0 ? (
          <View style={[styles.searchDropdown, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
            <Text style={styles.dropdownTitle}>Search Results</Text>
            {filteredSearchCustomers.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.dropdownRow, { borderBottomColor: currentColors.border }]}
                onPress={() => {
                  viewCustomerDetails(c.id);
                  setSearchQuery('');
                }}
              >
                <View>
                  <Text style={[styles.dropdownName, { color: currentColors.text }]}>{c.name}</Text>
                  <Text style={styles.dropdownPhone}>{c.phone}</Text>
                </View>
                <ChevronRight size={16} color={theme.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* Quick Action Shortcuts */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <Text style={styles.cardSectionLabel}>Quick Shortcuts</Text>
        <View style={styles.shortcutsGrid}>
          
          <TouchableOpacity 
            style={[styles.shortcutBtn, { backgroundColor: isDark ? '#111827' : '#f8fafc' }]}
            onPress={openAddCustomer}
            id="quick-add-customer-btn"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
              <UserPlus size={18} color="#0284c7" />
            </View>
            <Text style={[styles.shortcutText, { color: currentColors.text }]}>Add Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.shortcutBtn, { backgroundColor: isDark ? '#111827' : '#f8fafc' }]}
            onPress={() => {
              const firstPending = customers.find(c => c.status === 'Active');
              if (firstPending) {
                openPaymentEntry(firstPending.id, selectedMonth);
              } else {
                Alert.alert("Notice", "Please add active customers first!");
              }
            }}
            id="quick-add-payment-btn"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
              <CreditCard size={18} color="#10b981" />
            </View>
            <Text style={[styles.shortcutText, { color: currentColors.text }]}>Record Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.shortcutBtn, { backgroundColor: isDark ? '#111827' : '#f8fafc' }]}
            onPress={() => navigateTo('ledger')}
            id="quick-view-pending-btn"
          >
            <View style={[styles.iconContainer, { backgroundColor: '#ffedd5' }]}>
              <Clock size={18} color="#f97316" />
            </View>
            <Text style={[styles.shortcutText, { color: currentColors.text }]}>Ledger Month</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* Collection Ratio Gauge Chart */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: currentColors.text }]}>Collection Ratio</Text>
          <Text style={styles.chartSubtitle}>Billing allocation for {selectedMonth} {selectedYear}</Text>
        </View>

        <View style={styles.chartBody}>
          <View style={styles.gaugeWrapper}>
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <Circle
                cx="60"
                cy="60"
                r={radius}
                stroke={isDark ? '#334155' : '#f1f5f9'}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#0284c7"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90, 60, 60)"
              />
            </Svg>
            <View style={styles.gaugeInnerLabel}>
              <Text style={[styles.gaugePercent, { color: currentColors.text }]}>
                {stats.collectionPercentage.toFixed(0)}%
              </Text>
              <Text style={styles.gaugeSubText}>Collected</Text>
            </View>
          </View>

          <View style={styles.chartMetrics}>
            <View style={styles.metricItem}>
              <View style={[styles.indicatorDot, { backgroundColor: theme.colors.primary }]} />
              <View>
                <Text style={[styles.metricMain, { color: currentColors.text }]}>Paid: ₹{stats.collectedAmount}</Text>
                <Text style={styles.metricSub}>{stats.paidCustomers} completed</Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <View style={[styles.indicatorDot, { backgroundColor: theme.colors.warning }]} />
              <View>
                <Text style={[styles.metricMain, { color: currentColors.text }]}>Pending: ₹{stats.pendingAmount}</Text>
                <Text style={styles.metricSub}>{stats.pendingCustomers} remaining</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Received Payments */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Recent Received Payments</Text>
          <View style={styles.realtimeBadge}>
            <Text style={styles.realtimeBadgeText}>Live</Text>
          </View>
        </View>

        <View style={styles.paymentsList} id="recent-payments-container">
          {recentPaymentsList.length === 0 ? (
            <Text style={styles.emptyText}>No payments entered yet.</Text>
          ) : (
            recentPaymentsList.map((p) => {
              const cust = customers.find(c => c.id === p.customerId);
              return (
                <TouchableOpacity 
                  key={p.id} 
                  style={[styles.paymentItemRow, { backgroundColor: isDark ? '#111827' : '#f8fafc' }]}
                  onPress={() => cust && viewCustomerDetails(cust.id)}
                >
                  <View style={styles.paymentItemLeft}>
                    <View style={styles.modeBox}>
                      <Text style={styles.modeText}>{p.paymentMode.substring(0, 3)}</Text>
                    </View>
                    <View>
                      <Text style={[styles.paymentCustName, { color: currentColors.text }]} numberOfLines={1}>
                        {cust ? cust.name : 'Unknown Customer'}
                      </Text>
                      <Text style={styles.paymentMeta}>
                        {p.month} {p.year} • {p.paymentDate}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paymentItemRight}>
                    <Text style={styles.paymentAmount}>+₹{p.paidAmount}</Text>
                    <Text style={styles.paymentBal}>Bal: ₹{p.balance}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>

      {/* Pending Collections */}
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: currentColors.text }]}>Pending Collections ({selectedMonth})</Text>
          <TouchableOpacity onPress={() => navigateTo('customers')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pendingList} id="recent-pending-container">
          {activePendingCustomers.length === 0 ? (
            <Text style={styles.emptyText}>All customer payments collected! 🎉</Text>
          ) : (
            activePendingCustomers.map((item) => (
              <View 
                key={item.customer.id} 
                style={[styles.pendingItemRow, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: currentColors.border }]}
              >
                <View style={styles.pendingLeft}>
                  <TouchableOpacity onPress={() => viewCustomerDetails(item.customer.id)}>
                    <Text style={[styles.pendingName, { color: currentColors.text }]} numberOfLines={1}>
                      {item.customer.name}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.pendingPhone}>{item.customer.phone}</Text>
                  <View style={styles.pendingStatusContainer}>
                    <Text style={styles.pendingBillText}>₹{item.customer.monthlyBill}/mo</Text>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{item.status.status}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.pendingRight}>
                  <Text style={styles.outstandingText}>Due: ₹{item.totalOutstanding}</Text>
                  <TouchableOpacity
                    id={`pay-entry-shortcut-${item.customer.id}`}
                    onPress={() => openPaymentEntry(item.customer.id, selectedMonth)}
                    style={styles.collectBtn}
                  >
                    <Text style={styles.collectBtnText}>Collect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
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
  },
  headerCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    paddingHorizontal: 4,
  },
  searchDropdown: {
    marginTop: 12,
    borderRadius: 14,
    padding: 8,
  },
  dropdownTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  dropdownName: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownPhone: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  shortcutBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  chartSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  chartBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  gaugeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInnerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercent: {
    fontSize: 20,
    fontWeight: '900',
  },
  gaugeSubText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  chartMetrics: {
    justifyContent: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metricMain: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  realtimeBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  realtimeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
    textTransform: 'uppercase',
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  paymentsList: {
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  },
  paymentItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
  },
  paymentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeBox: {
    width: 32,
    height: 32,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#047857',
  },
  paymentCustName: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 160,
  },
  paymentMeta: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 1,
  },
  paymentItemRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10b981',
  },
  paymentBal: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 1,
  },
  pendingList: {
    gap: 10,
  },
  pendingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  pendingLeft: {
    flex: 1,
  },
  pendingName: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 160,
  },
  pendingPhone: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 1,
  },
  pendingStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pendingBillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  pendingBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ea580c',
    textTransform: 'uppercase',
  },
  pendingRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  outstandingText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#f43f5e',
  },
  collectBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collectBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
});
