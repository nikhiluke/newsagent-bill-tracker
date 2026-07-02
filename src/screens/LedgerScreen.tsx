import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
} from 'react-native';
import { useAppState } from '../hooks/useAppState';
import { 
  Search, ChevronLeft, Check, Info 
} from 'lucide-react-native';
import { getCustomerStatusForMonth, calculateCustomerOutstanding, getCurrentMonth, getCurrentYear, getActiveCustomer } from '../utility';
import { theme } from '../theme';
import MonthYearPicker from '../components/MonthYearPicker';

export default function LedgerScreen() {
  const {
    customers,
    payments,
    paymentEntryCustomerId,
    paymentEntryPreselectedMonth,
    addPayment,
    openPaymentEntry,
    closeSubScreens,
    viewCustomerDetails,
    settings
  } = useAppState();

  const currentYear = getCurrentYear()
  const currentMonth = getCurrentMonth()

  // Monthly Ledger States
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const [statusFilter, setStatusFilter] = useState<string>('All'); // All, Paid, Pending/Overdue
  const [ledgerSearch, setLedgerSearch] = useState<string>('');

  // Payment Entry Form States (Local state)
  const [formCustomerId, setFormCustomerId] = useState<string>('');
  const [formMonth, setFormMonth] = useState<string>(currentMonth);
  const [formYear, setFormYear] = useState<number>(currentYear);
  const [formBillAmount, setFormBillAmount] = useState<number>(0);
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formLateFee, setFormLateFee] = useState<number>(0);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(0);
  const [formPaymentMode, setFormPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [formPaymentDate, setFormPaymentDate] = useState<string>('');
  const [formRemarks, setFormRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Auto-fill form values when pre-selected from state triggers
  useEffect(() => {
    if (paymentEntryCustomerId) {
      setFormCustomerId(paymentEntryCustomerId);
      const cust = customers.find(c => c.id === paymentEntryCustomerId);
      if (cust) {
        setFormBillAmount(cust.monthlyBill);
        setFormPaidAmount(cust.monthlyBill);
      }
      
      if (paymentEntryPreselectedMonth) {
        setFormMonth(paymentEntryPreselectedMonth);
      } else {
        setFormMonth(currentMonth);
      }
      
      setFormYear(currentYear);
      setFormDiscount(0);
      setFormLateFee(0);
      setFormRemarks('');
      setFormPaymentMode('UPI');
      setFormPaymentDate(new Date().toISOString().split('T')[0]);
      setFormError('');
    }
  }, [paymentEntryCustomerId, paymentEntryPreselectedMonth, customers]);

  const finalCalculatedAmount = Math.max(0, formBillAmount - formDiscount + formLateFee);

  // Auto set paid amount equal to final net amount by default
  useEffect(() => {
    setFormPaidAmount(finalCalculatedAmount);
  }, [formBillAmount, formDiscount, formLateFee, finalCalculatedAmount]);

  // Handle Recording New Payment
  const handleSavePayment = () => {
    if (!formCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (formPaidAmount < 0) {
      setFormError('Paid amount cannot be negative.');
      return;
    }

    const netAmount = finalCalculatedAmount;
    const balance = Math.max(0, netAmount - formPaidAmount);

    addPayment({
      customerId: formCustomerId,
      month: formMonth,
      year: Number(formYear),
      billAmount: Number(formBillAmount),
      discount: Number(formDiscount),
      lateFee: Number(formLateFee),
      finalAmount: netAmount,
      paidAmount: Number(formPaidAmount),
      balance: balance,
      paymentMode: formPaymentMode,
      paymentDate: formPaymentDate || new Date().toISOString().split('T')[0],
      remarks: formRemarks.trim() || undefined
    });
  };

  // Compile ledger list data based on filters
  const activeCustomers = getActiveCustomer(customers, selectedMonth, selectedYear)
  
  const ledgerRows = activeCustomers.map(c => {
    const status = getCustomerStatusForMonth(c, selectedMonth, selectedYear, payments);
    return {
      customer: c,
      status
    };
  });

  const filteredLedger = ledgerRows.filter(row => {
    let matchesStatus = true;
    if (statusFilter === 'Paid') {
      matchesStatus = row.status.status === 'Paid';
    } else if (statusFilter === 'Pending') {
      matchesStatus = row.status.status !== 'Paid';
    }

    const matchesSearch = row.customer.name.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          row.customer.phone.includes(ledgerSearch);

    return matchesStatus && matchesSearch;
  });

  // Calculate stats for this filtered ledger view
  const totalBilled = filteredLedger.reduce((sum, row) => sum + row.status.billAmount, 0);
  const totalCollected = filteredLedger.reduce((sum, row) => sum + row.status.paidAmount, 0);
  const totalPending = filteredLedger.reduce((sum, row) => sum + row.status.balance, 0);
  const collectionPercentage = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0;

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

  // Section 1: Record Payment Entry Form
  if (paymentEntryCustomerId) {
    const selectedCustomerObject = customers.find(c => c.id === formCustomerId);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" id="payment-entry-screen">
        <View style={[styles.headerSubCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={closeSubScreens}>
            <ChevronLeft size={18} color={theme.colors.primary} />
            <Text style={styles.backBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerSubTitle, { color: currentColors.text }]}>Record Monthly Payment</Text>
          <View style={styles.placeholderWidth} />
        </View>

        {formError ? (
          <View style={styles.formErrorAlert}>
            <Info size={18} color={theme.colors.danger} />
            <Text style={styles.formErrorText}>{formError}</Text>
          </View>
        ) : null}

        {selectedCustomerObject ? (
          <View style={[styles.customerProfilePreview, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderColor: isDark ? '#334155' : '#e0f2fe' }]}>
            <View>
              <Text style={styles.custPrevLabel}>Recording payment for</Text>
              <Text style={[styles.custPrevName, { color: currentColors.text }]}>{selectedCustomerObject.name}</Text>
              <Text style={[styles.custPrevSub, { color: currentColors.textLight }]}>
                {selectedCustomerObject.newspaperName} • ₹{selectedCustomerObject.monthlyBill}/mo
              </Text>
            </View>

            <View style={styles.custPrevDuesCard}>
              <Text style={styles.custPrevDuesLabel}>Cumulative Dues</Text>
              <Text style={styles.custPrevDuesValue}>
                ₹{calculateCustomerOutstanding(selectedCustomerObject, payments).totalOutstanding}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.formContainer, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
          {/* Form Fields */}
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Billing Period</Text>
            <MonthYearPicker
              selectedMonth={formMonth}
              selectedYear={formYear}
              onMonthChange={setFormMonth}
              onYearChange={setFormYear}
              isDark={isDark}
              years={[currentYear, currentYear + 1, currentYear + 2 ]}
              showLabels={false}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Newspaper Bill Amount (₹)</Text>
            <TextInput
              id="payment-bill-input"
              style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              keyboardType="number-pad"
              value={String(formBillAmount)}
              onChangeText={(text) => setFormBillAmount(Number(text.replace(/\D/g, '')) || 0)}
            />
          </View>

          <View style={styles.formField}>
            <View style={styles.flexRowBetween}>
              <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Discount Granted (₹)</Text>
              <Text style={styles.optionalLabel}>Optional</Text>
            </View>
            <TextInput
              id="payment-discount-input"
              style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              keyboardType="number-pad"
              value={String(formDiscount)}
              onChangeText={(text) => setFormDiscount(Number(text.replace(/\D/g, '')) || 0)}
            />
          </View>

          <View style={styles.formField}>
            <View style={styles.flexRowBetween}>
              <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Late Payment Fee (₹)</Text>
              <Text style={styles.optionalLabelWarning}>Optional</Text>
            </View>
            <TextInput
              id="payment-late-fee-input"
              style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              keyboardType="number-pad"
              value={String(formLateFee)}
              onChangeText={(text) => setFormLateFee(Number(text.replace(/\D/g, '')) || 0)}
            />
          </View>

          {/* Computed net final amount display banner */}
          <View style={styles.computedBanner}>
            <Text style={styles.computedBannerLabel}>Amount Billed / Net Due Amount</Text>
            <View style={styles.computedValueRow}>
              <Text style={styles.computedBannerValue}>₹{finalCalculatedAmount}</Text>
              <Text style={styles.computedBannerSub}>(Auto computed)</Text>
            </View>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Amount Collected / Paid (₹) *</Text>
            <TextInput
              id="payment-paid-input"
              style={[styles.formInput, styles.heavyInput, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              keyboardType="number-pad"
              value={String(formPaidAmount)}
              onChangeText={(text) => setFormPaidAmount(Number(text.replace(/\D/g, '')) || 0)}
            />
            {formPaidAmount < finalCalculatedAmount ? (
              <Text style={styles.partialText}>
                Partial Payment! Re-outstanding: ₹{finalCalculatedAmount - formPaidAmount}
              </Text>
            ) : null}
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Payment Collection Date</Text>
            <TextInput
              id="payment-date-input"
              style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              placeholder="YYYY-MM-DD"
              value={formPaymentDate}
              onChangeText={setFormPaymentDate}
            />
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Payment Mode / Option</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
              {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map((mode) => {
                const isSelected = formPaymentMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.pillButton, 
                      { backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#334155' : '#f1f5f9') }
                    ]}
                    onPress={() => setFormPaymentMode(mode as any)}
                  >
                    <Text style={[styles.pillButtonText, { color: isSelected ? '#ffffff' : currentColors.text }]}>{mode}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Remarks / Ledger Note</Text>
            <TextInput
              id="payment-remarks-input"
              style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
              placeholder="Collected by Ramu, given discount for display"
              placeholderTextColor={theme.colors.textMuted}
              value={formRemarks}
              onChangeText={setFormRemarks}
            />
          </View>

          {/* Form Actions */}
          <View style={styles.formActionsRow}>
            <TouchableOpacity 
              style={styles.saveSubmitBtn} 
              onPress={handleSavePayment}
              id="payment-save-btn"
            >
              <Check size={16} color="#ffffff" />
              <Text style={styles.saveSubmitBtnText}>Record Payment Ledger</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.saveCancelBtn} 
              onPress={closeSubScreens}
              id="payment-cancel-btn"
            >
              <Text style={styles.saveCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    );
  }

  // Section 2: Monthly Ledger Grid View
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" id="monthly-ledger-screen">
      <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]} id="monthly-ledger-board-section">
        
        {/* Board Header Title & Year selectors */}
        <View style={styles.listHeaderRow}>
          <View>
            <Text style={[styles.listHeaderTitle, { color: currentColors.text }]}>Monthly Ledger Board</Text>
            <Text style={styles.listHeaderSubtitle}>Filter billing logs for any month</Text>
          </View>

        </View>

        {/* Month + Year picker */}
        <View style={styles.ledgerPickerWrapper}>
          <MonthYearPicker
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            isDark={isDark}
            showLabels={false}
          />
        </View>

        {/* Status filter selection pills row */}
        <View style={styles.filterPillsContainer}>
          {[
            { id: 'All', label: 'All Payments' },
            { id: 'Paid', label: 'Collected (Paid)' },
            { id: 'Pending', label: 'Unpaid (Pending)' }
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPillBtn,
                  { backgroundColor: isSelected ? '#0284c7' : (isDark ? '#334155' : '#f1f5f9') }
                ]}
                onPress={() => setStatusFilter(tab.id)}
              >
                <Text style={[styles.filterPillBtnText, { color: isSelected ? '#ffffff' : currentColors.text }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Financial Summary Panel Strip */}
        <View style={[styles.summaryStrip, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe', borderColor: isDark ? '#334155' : '#bae6fd' }]} id="ledger-stats-strip">
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Scope Target</Text>
              <Text style={[styles.summaryColValBig, { color: currentColors.text }]}>{selectedMonth} {selectedYear}</Text>
              <Text style={styles.summaryColSub}>Ledger</Text>
            </View>

            <View style={[styles.summaryCol, styles.colBorderLeft]}>
              <Text style={styles.summaryColLabel}>Billed Target</Text>
              <Text style={[styles.summaryColValBig, { color: currentColors.text }]}>₹{totalBilled}</Text>
              <Text style={styles.summaryColSub}>{filteredLedger.length} logs</Text>
            </View>

            <View style={[styles.summaryCol, styles.colBorderLeft]}>
              <Text style={[styles.summaryColLabel, { color: '#047857' }]}>Collected</Text>
              <Text style={styles.summaryColCollectedText}>₹{totalCollected}</Text>
              <View style={styles.collectedPercentBadge}>
                <Text style={styles.collectedPercentText}>{collectionPercentage.toFixed(0)}%</Text>
              </View>
            </View>

            <View style={[styles.summaryCol, styles.colBorderLeft]}>
              <Text style={[styles.summaryColLabel, { color: '#be123c' }]}>Pending Dues</Text>
              <Text style={styles.summaryColPendingText}>₹{totalPending}</Text>
              <Text style={styles.summaryColSub}>Outstanding</Text>
            </View>
          </View>
        </View>

        {/* Live Search Customer box */}
        <View style={[styles.searchWrapper, { backgroundColor: currentColors.inputBg }]}>
          <Search size={16} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            id="ledger-search-input"
            style={[styles.searchInput, { color: currentColors.text }]}
            placeholder="Search ledger customer name..."
            placeholderTextColor={theme.colors.textMuted}
            value={ledgerSearch}
            onChangeText={setLedgerSearch}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: currentColors.border }]} />

        {/* Ledger Customer rows list */}
        <View style={styles.ledgerGrid} id="ledger-grid-container">
          <Text style={styles.listSectionTitle}>Ledger Items</Text>
          {filteredLedger.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Info size={32} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No ledger records match filter settings.</Text>
            </View>
          ) : (
            filteredLedger.map(({ customer, status }) => {
              const isPaid = status.status === 'Paid';
              const outstanding = calculateCustomerOutstanding(customer, payments);

              return (
                <View 
                  key={customer.id} 
                  style={[styles.ledgerRowCard, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: currentColors.border }]}
                >
                  <View style={styles.rowMainLeft}>
                    <TouchableOpacity onPress={() => viewCustomerDetails(customer.id)}>
                      <Text style={[styles.ledgerCustomerName, { color: currentColors.text }]} numberOfLines={1}>
                        {customer.name}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.ledgerCustomerMeta}>
                      {customer.newspaperName} (₹{customer.monthlyBill}/mo)
                    </Text>

                    <View style={styles.ledgerRowBadges}>
                      <View style={[styles.rowStatusBadge, { backgroundColor: isPaid ? '#d1fae5' : '#ffe4e6' }]}>
                        <Text style={[styles.rowStatusBadgeText, { color: isPaid ? '#047857' : '#be123c' }]}>
                          {isPaid ? 'Paid' : 'Pending'}
                        </Text>
                      </View>
                      <View style={styles.rowDueBadge}>
                        <Text style={styles.rowDueBadgeText}>Total Due: ₹{outstanding.totalOutstanding}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.rowMainRight}>
                    <View style={styles.billingLabelAmountGroup}>
                      <Text style={styles.billingMetaLabel}>{isPaid ? 'Collected' : 'Bill Amount'}</Text>
                      <Text style={[styles.billingMetaVal, { color: isPaid ? '#10b981' : '#f97316' }]}>
                        ₹{isPaid ? status.paidAmount : status.balance}
                      </Text>
                    </View>

                    {isPaid ? (
                      <TouchableOpacity 
                        style={styles.receiptDetailsBtn}
                        onPress={() => viewCustomerDetails(customer.id)}
                      >
                        <Check size={14} color="#047857" style={styles.checkIcon} />
                        <Text style={styles.receiptDetailsText}>Receipt</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        id={`ledger-collect-btn-${customer.id}`}
                        style={styles.collectDuesBtn}
                        onPress={() => openPaymentEntry(customer.id, selectedMonth)}
                      >
                        <Text style={styles.collectDuesText}>Collect</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
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
  headerSubCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284c7',
  },
  headerSubTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  placeholderWidth: {
    width: 48,
  },
  formErrorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    gap: 8,
  },
  formErrorText: {
    fontSize: 11,
    color: '#be123c',
    fontWeight: '700',
  },
  customerProfilePreview: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  custPrevLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
  custPrevName: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  custPrevSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  custPrevDuesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  custPrevDuesLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  custPrevDuesValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ef4444',
    marginTop: 2,
  },
  formContainer: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    gap: 16,
  },
  formField: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 6,
  },
  pillButtonText: {
    fontSize: 11,
    fontWeight: '800',
  },
  yearToggleRow: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  yearToggleBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    fontWeight: '600',
  },
  heavyInput: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0284c7',
  },
  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  optionalLabelWarning: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f43f5e',
  },
  computedBanner: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  computedBannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  computedValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  computedBannerValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  computedBannerSub: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  partialText: {
    fontSize: 10,
    color: '#ea580c',
    fontWeight: '700',
    marginTop: 4,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  saveSubmitBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveSubmitBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  saveCancelBtn: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCancelBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  listHeaderSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  ledgerPickerWrapper: {
    marginBottom: 16,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  filterPillBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillBtnText: {
    fontSize: 9,
    fontWeight: '900',
  },
  summaryStrip: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  colBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#bae6fd',
    paddingLeft: 4,
  },
  summaryColLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#0284c7',
    textTransform: 'uppercase',
  },
  summaryColValBig: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryColSub: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },
  summaryColCollectedText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#047857',
    marginTop: 2,
  },
  collectedPercentBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginTop: 2,
  },
  collectedPercentText: {
    fontSize: 8,
    color: '#047857',
    fontWeight: '900',
  },
  summaryColPendingText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#be123c',
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  ledgerGrid: {},
  listSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  ledgerRowCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowMainLeft: {
    flex: 1,
    gap: 2,
  },
  ledgerCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    maxWidth: 160,
  },
  ledgerCustomerMeta: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  ledgerRowBadges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  rowStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rowStatusBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  rowDueBadge: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  rowDueBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#ef4444',
  },
  rowMainRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  billingLabelAmountGroup: {
    alignItems: 'flex-end',
  },
  billingMetaLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  billingMetaVal: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  receiptDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkIcon: {
    marginTop: 1,
  },
  receiptDetailsText: {
    color: '#047857',
    fontSize: 9,
    fontWeight: '800',
  },
  collectDuesBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collectDuesText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
});
