import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppState } from '../hooks/useAppState';
import {
    Search, Phone, MessageSquare, Edit, Trash2,
    Plus, ChevronLeft, Calendar, MapPin, Newspaper, CheckCircle,
    AlertCircle,Info,Printer,
} from 'lucide-react-native';
import { calculateCustomerOutstanding, getCurrentMonth } from '../utility';
import { NEWSPAPERS } from '../data';
import { Customer } from '../types';
import ReceiptModal from '../components/ReceiptModal';
import { theme } from '../theme';

export default function CustomersScreen() {
    const {
        profile,
        customers,
        payments,
        selectedCustomerId,
        editingCustomerId,
        viewCustomerDetails,
        openAddCustomer,
        openEditCustomer,
        openPaymentEntry,
        closeSubScreens,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        deletePayment,
        settings
    } = useAppState();

    // Screen 2 States (List)
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active'); // All, Active, Inactive, PendingDues
    const [sortBy, setSortBy] = useState<'name' | 'bill' | 'dues'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Screen 3 States (Form)
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formLandmark, setFormLandmark] = useState('');
    const [formNewspaper, setFormNewspaper] = useState('');
    const [formCount, setFormCount] = useState(1);
    const [formBill, setFormBill] = useState(0);
    const [formStartDate, setFormStartDate] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
    const [formError, setFormError] = useState('');
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);

    // Receipt Modal State
    const [activeReceiptPayment, setActiveReceiptPayment] = useState<any>(null);

    // Load editing customer info into form
    useEffect(() => {
        if (editingCustomerId && editingCustomerId !== 'new') {
            const cust = customers.find(c => c.id === editingCustomerId);
            if (cust) {
                setFormName(cust.name);
                setFormPhone(cust.phone);
                setFormAddress(cust.address);
                setFormLandmark(cust.landmark || '');
                setFormNewspaper(cust.newspaperName);
                setFormCount(cust.newspapersCount);
                setFormBill(cust.monthlyBill);
                setFormStartDate(cust.startDate);
                setFormNotes(cust.deliveryNotes || '');
                setFormStatus(cust.status);
            }
        } else {
            // Clear for new
            setFormName('');
            setFormPhone('');
            setFormAddress('');
            setFormLandmark('');
            setFormNewspaper(settings.supportedNewspapers && settings.supportedNewspapers.length > 0 ? settings.supportedNewspapers[0] : NEWSPAPERS[0] || '');
            setFormCount(1);
            setFormBill(0);
            setFormStartDate(new Date().toISOString().split('T')[0]);
            setFormNotes('');
            setFormStatus('Active');
        }
        setFormError('');
    }, [editingCustomerId, customers]);

    // Handle Save Customer Form
    const handleSaveCustomer = () => {
        if (!formName.trim() || formName.trim().length < 3) {
            setFormError('Customer Name is required (minimum 3 characters)');
            return;
        }
        if (!/^\d{10}$/.test(formPhone)) {
            setFormError('Please enter a valid 10-digit Mobile Number');
            return;
        }
        if (!formAddress.trim()) {
            setFormError('Delivery Address is required');
            return;
        }
        if (formBill <= 0) {
            setFormError('Monthly Bill must be a positive number');
            return;
        }

        const customerPayload = {
            name: formName.trim(),
            phone: formPhone,
            address: formAddress.trim(),
            landmark: formLandmark.trim() || undefined,
            newspaperName: formNewspaper,
            newspapersCount: Number(formCount),
            monthlyBill: Number(formBill),
            startDate: formStartDate,
            deliveryNotes: formNotes.trim() || undefined,
            status: formStatus
        };

        if (editingCustomerId === 'new') {
            addCustomer(customerPayload);
        } else {
            updateCustomer(editingCustomerId!, customerPayload);
        }
    };

    // WhatsApp Reminder
    const sendWhatsAppReminder = (customer: Customer, amount: number) => {
        const text = `Hello ${customer.name}, this is a gentle reminder from ${profile.businessName}. Your newspaper monthly outstanding balance is ₹${amount}. Please clear the amount via UPI or cash. Thank you!`;
        const url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(text)}`;
        Linking.openURL(url).catch((err) => {
            console.warn("Could not launch WhatsApp link", err);
            Alert.alert("Link error", "Could not open messaging url.");
        });
    };

    const handleQuickMarkPaid = (customer: Customer) => {
        openPaymentEntry(customer.id, getCurrentMonth());
    };

    // Process list data (filtering + sorting)
    const listData = customers.map(c => {
        const { totalOutstanding, pendingMonthsCount, history } = calculateCustomerOutstanding(c, payments);
        // Find last payment date
        const custPayments = payments.filter(p => p.customerId === c.id);
        const lastPayment = custPayments.length > 0
            ? [...custPayments].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0]
            : null;

        return {
            customer: c,
            totalOutstanding,
            pendingMonthsCount,
            lastPaymentDate: lastPayment ? lastPayment.paymentDate : 'None',
            history
        };
    });

    const filteredList = listData.filter(item => {
        const matchesSearch = item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.customer.phone.includes(searchTerm) ||
            item.customer.newspaperName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'Active') {
            matchesStatus = item.customer.status === 'Active';
        } else if (statusFilter === 'Inactive') {
            matchesStatus = item.customer.status === 'Inactive';
        } else if (statusFilter === 'PendingDues') {
            matchesStatus = item.customer.status === 'Active' && item.totalOutstanding > 0;
        }

        return matchesSearch && matchesStatus;
    });

    const sortedList = [...filteredList].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
            comparison = a.customer.name.localeCompare(b.customer.name);
        } else if (sortBy === 'bill') {
            comparison = a.customer.monthlyBill - b.customer.monthlyBill;
        } else if (sortBy === 'dues') {
            comparison = a.totalOutstanding - b.totalOutstanding;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const toggleSort = (type: 'name' | 'bill' | 'dues') => {
        if (sortBy === type) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(type);
            setSortOrder('desc');
        }
    };

    const activeDetailItem = selectedCustomerId ? listData.find(item => item.customer.id === selectedCustomerId) : null;

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

    // Section 1: Customer Add/Edit Form
    if (editingCustomerId) {
        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" id="add-edit-customer-screen">
                <View style={[styles.headerSubCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={closeSubScreens}>
                        <ChevronLeft size={18} color={theme.colors.primary} />
                        <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerSubTitle, { color: currentColors.text }]}>
                        {editingCustomerId === 'new' ? 'Add New Customer' : 'Edit Customer Record'}
                    </Text>
                    <View style={styles.placeholderWidth} />
                </View>

                <View style={[styles.formContainer, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                    {/* Form Fields */}
                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Full Name *</Text>
                        <TextInput
                            id="form-customer-name"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Ramesh Kumar"
                            placeholderTextColor={theme.colors.textMuted}
                            value={formName}
                            onChangeText={setFormName}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Mobile Number *</Text>
                        <TextInput
                            id="form-customer-phone"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Enter 10-digit number"
                            placeholderTextColor={theme.colors.textMuted}
                            keyboardType="phone-pad"
                            maxLength={10}
                            value={formPhone}
                            onChangeText={(text) => setFormPhone(text.replace(/\D/g, ''))}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Delivery Address *</Text>
                        <TextInput
                            id="form-customer-address"
                            style={[styles.formInput, styles.formTextArea, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Flat / House Number, Street, Building Name"
                            placeholderTextColor={theme.colors.textMuted}
                            multiline
                            numberOfLines={2}
                            value={formAddress}
                            onChangeText={setFormAddress}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Landmark / Landmark Note</Text>
                        <TextInput
                            id="form-customer-landmark"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Near Temple / Petrol Pump"
                            placeholderTextColor={theme.colors.textMuted}
                            value={formLandmark}
                            onChangeText={setFormLandmark}
                        />
                    </View>

                    {/* Newspaper Name Selector Row */}
                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Newspaper Name *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.newspaperPillRow}>
                            {(settings.supportedNewspapers && settings.supportedNewspapers.length > 0 ? settings.supportedNewspapers : NEWSPAPERS).map((newspaper) => {
                                const isSelected = formNewspaper === newspaper;
                                return (
                                    <TouchableOpacity
                                        key={newspaper}
                                        style={[
                                            styles.newspaperPill,
                                            { backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#334155' : '#f1f5f9') }
                                        ]}
                                        onPress={() => setFormNewspaper(newspaper)}
                                    >
                                        <Text style={[styles.newspaperPillText, { color: isSelected ? '#ffffff' : currentColors.text }]}>
                                            {newspaper}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Number of Copies</Text>
                        <TextInput
                            id="form-customer-copies"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            keyboardType="number-pad"
                            value={String(formCount)}
                            onChangeText={(text) => {
                                const copies = Number(text.replace(/\D/g, '')) || 0;
                                setFormCount(copies);
                            }}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Monthly Bill Amount (₹) *</Text>
                        <TextInput
                            id="form-customer-bill"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            keyboardType="number-pad"
                            placeholder="250"
                            value={String(formBill)}
                            onChangeText={(text) => setFormBill(Number(text.replace(/\D/g, '')) || 0)}
                        />
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Start Subscription Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowStartDatePicker(true)}
                            style={[styles.formInput, { justifyContent: 'center', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                        >
                            <Text style={{ color: currentColors.text }}>{formStartDate || 'Select Date'}</Text>
                        </TouchableOpacity>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={formStartDate ? new Date(formStartDate) : new Date()}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    if (event.type === 'set' && selectedDate) {
                                        const iso = selectedDate.toISOString().split('T')[0];
                                        setFormStartDate(iso);
                                    }
                                    setShowStartDatePicker(false);
                                }}
                            />
                        )}
                    </View>

                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Special Delivery Instructions</Text>
                        <TextInput
                            id="form-customer-notes"
                            style={[styles.formInput, { color: currentColors.text, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
                            placeholder="Slide under door, deliver by 6 AM"
                            placeholderTextColor={theme.colors.textMuted}
                            value={formNotes}
                            onChangeText={setFormNotes}
                        />
                    </View>

                    {/* Subscription Status Toggle */}
                    <View style={styles.formField}>
                        <Text style={[styles.formLabel, { color: currentColors.textLight }]}>Subscription Status</Text>
                        <View style={styles.statusToggleRow}>
                            <TouchableOpacity
                                style={[
                                    styles.toggleBtnLeft,
                                    { backgroundColor: formStatus === 'Active' ? theme.colors.primary : (isDark ? '#334155' : '#f1f5f9') }
                                ]}
                                onPress={() => setFormStatus('Active')}
                            >
                                <Text style={[styles.toggleBtnText, { color: formStatus === 'Active' ? '#ffffff' : currentColors.text }]}>Active</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.toggleBtnRight,
                                    { backgroundColor: formStatus === 'Inactive' ? theme.colors.danger : (isDark ? '#334155' : '#f1f5f9') }
                                ]}
                                onPress={() => setFormStatus('Inactive')}
                            >
                                <Text style={[styles.toggleBtnText, { color: formStatus === 'Inactive' ? '#ffffff' : currentColors.text }]}>Inactive</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Save Action Buttons */}
                    <View style={styles.formActionsRow}>
                        <TouchableOpacity
                            style={styles.saveSubmitBtn}
                            onPress={handleSaveCustomer}
                            id="form-save-btn"
                        >
                            <Text style={styles.saveSubmitBtnText}>Save Customer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.saveCancelBtn}
                            onPress={closeSubScreens}
                            id="form-cancel-btn"
                        >
                            <Text style={styles.saveCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {formError ? (
                    <View style={styles.formErrorAlert}>
                        <AlertCircle size={18} color={theme.colors.danger} />
                        <Text style={styles.formErrorText}>{formError}</Text>
                    </View>
                ) : null}
            </ScrollView>
        );
    }

    // Section 2: Customer Details View
    if (selectedCustomerId && activeDetailItem) {
        const { customer, totalOutstanding, pendingMonthsCount, lastPaymentDate, history } = activeDetailItem;
        const customerPayments = payments.filter(p => p.customerId === customer.id);
        const totalPaidSum = customerPayments.reduce((sum, p) => sum + p.paidAmount, 0);
        const monthsPaidCount = customerPayments.length;

        return (
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} id="customer-details-screen">
                <View style={[styles.headerSubCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={closeSubScreens}>
                        <ChevronLeft size={18} color={theme.colors.primary} />
                        <Text style={styles.backBtnText}>Back to List</Text>
                    </TouchableOpacity>

                    <View style={styles.detailRowActions}>
                        <TouchableOpacity
                            style={[styles.actionBtnIcon, { backgroundColor: '#e0f2fe' }]}
                            onPress={() => openEditCustomer(customer.id)}
                            id="details-edit-btn"
                        >
                            <Edit size={16} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtnIcon, { backgroundColor: '#ffe4e6' }]}
                            onPress={() => {
                                Alert.alert(
                                    "Delete Customer",
                                    `Are you sure you want to delete ${customer.name}? This will clear all historical payment ledgers permanently.`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Delete Permanently", style: "destructive", onPress: () => deleteCustomer(customer.id) }
                                    ]
                                );
                            }}
                            id="details-delete-btn"
                        >
                            <Trash2 size={16} color={theme.colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                    <View style={styles.profileHeader}>
                        <View>
                            <View style={styles.badgeRow}>
                                <View style={[styles.statusBadge, { backgroundColor: customer.status === 'Active' ? '#d1fae5' : '#cbd5e1' }]}>
                                    <Text style={[styles.statusBadgeText, { color: customer.status === 'Active' ? '#047857' : '#475569' }]}>
                                        {customer.status}
                                    </Text>
                                </View>
                                <Text style={styles.customerIdText}>ID: {customer.id}</Text>
                            </View>
                            <Text style={[styles.profileName, { color: currentColors.text }]}>{customer.name}</Text>
                            <View style={styles.newspaperSubtitle}>
                                <Newspaper size={14} color="#0284c7" />
                                <Text style={styles.newspaperSubtitleText}>
                                    {customer.newspaperName} (x{customer.newspapersCount}) • ₹{customer.monthlyBill}/mo
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Connect buttons */}
                    <View style={styles.profileActionsRow}>
                        <TouchableOpacity
                            style={styles.callProfileBtn}
                            onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                        >
                            <Phone size={14} color="#0284c7" />
                            <Text style={styles.callProfileBtnText}>Call Phone</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.waProfileBtn}
                            onPress={() => sendWhatsAppReminder(customer, totalOutstanding)}
                        >
                            <MessageSquare size={14} color="#10b981" />
                            <Text style={styles.waProfileBtnText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Location & Router Details */}
                    <View style={[styles.detailDetailsSection, { borderTopColor: currentColors.border }]}>
                        <View style={styles.detailDetailsRow}>
                            <MapPin size={16} color={theme.colors.textMuted} />
                            <View style={styles.detailDetailsTextContainer}>
                                <Text style={styles.detailMetaLabel}>Delivery Address</Text>
                                <Text style={[styles.detailMetaValue, { color: currentColors.text }]}>{customer.address}</Text>
                                {customer.landmark ? (
                                    <Text style={styles.detailMetaSub}>Landmark: {customer.landmark}</Text>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.detailDetailsRow}>
                            <Calendar size={16} color={theme.colors.textMuted} />
                            <View style={styles.detailDetailsTextContainer}>
                                <Text style={styles.detailMetaLabel}>Subscription Date</Text>
                                <Text style={[styles.detailMetaValue, { color: currentColors.text }]}>Active Since {customer.startDate}</Text>
                            </View>
                        </View>

                        {customer.deliveryNotes ? (
                            <View style={styles.instructionsContainer}>
                                <Info size={14} color="#0284c7" style={styles.instructionsIcon} />
                                <View>
                                    <Text style={styles.instructionsLabel}>Delivery Instructions</Text>
                                    <Text style={styles.instructionsValue}>{customer.deliveryNotes}</Text>
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Ledger Statistics */}
                <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                    <Text style={styles.cardSectionLabel}>Financial Ledger Summary</Text>
                    <View style={styles.financeGrid}>
                        <View style={[styles.financeCol, { backgroundColor: '#ffe4e6' }]}>
                            <Text style={styles.financeLabelText}>Outstanding</Text>
                            <Text style={styles.financeValueTextBig}>₹{totalOutstanding}</Text>
                            <Text style={styles.financeSubText}>{pendingMonthsCount} months unpaid</Text>
                        </View>
                        <View style={[styles.financeCol, { backgroundColor: '#d1fae5' }]}>
                            <Text style={styles.financeLabelText}>Total Paid</Text>
                            <Text style={styles.financeValueTextBig}>₹{totalPaidSum}</Text>
                            <Text style={styles.financeSubText}>{monthsPaidCount} records</Text>
                        </View>
                    </View>

                    {customer.status === 'Active' && totalOutstanding > 0 ? (
                        <TouchableOpacity
                            style={styles.detailsRecordBtn}
                            onPress={() => openPaymentEntry(customer.id, getCurrentMonth())}
                            id="details-collect-btn"
                        >
                            <CheckCircle size={16} color="#ffffff" />
                            <Text style={styles.detailsRecordBtnText}>Record Payment Cash Entry (₹{totalOutstanding})</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Timeline Log */}
                <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]}>
                    <Text style={styles.cardSectionLabel}>Customer History Timeline</Text>
                    <View style={styles.timelineContainer}>
                        {history.map((status) => {
                            const isPaid = status.status === 'Paid';
                            return (
                                <View key={`${status.month}-${status.year}`} style={styles.timelineRow}>
                                    <View style={[styles.timelineDot, { backgroundColor: isPaid ? '#10b981' : '#f43f5e' }]} />
                                    <View style={[styles.timelineCard, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: currentColors.border }]}>
                                        <View style={styles.timelineHeaderRow}>
                                            <Text style={[styles.timelineMonth, { color: currentColors.text }]}>{status.month} {status.year}</Text>
                                            <View style={[styles.timelineStatusBadge, { backgroundColor: isPaid ? '#d1fae5' : '#ffe4e6' }]}>
                                                <Text style={[styles.timelineStatusText, { color: isPaid ? '#047857' : '#be123c' }]}>{status.status}</Text>
                                            </View>
                                        </View>

                                        {isPaid ? (
                                            <View style={styles.timelineBody}>
                                                <Text style={[styles.timelineBodyText, { color: currentColors.text }]}>
                                                    Paid <Text style={styles.boldText}>₹{status.paidAmount}</Text> via <Text style={styles.boldText}>{status.paymentMode}</Text> on {status.paymentDate}
                                                </Text>
                                                {status.remarks ? (
                                                    <Text style={styles.timelineRemarks}>Remarks: "{status.remarks}"</Text>
                                                ) : null}
                                                <Text style={styles.timelineReceipt}>Receipt No: {status.receiptNumber}</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.timelineBody}>
                                                <Text style={[styles.timelineBodyText, { color: currentColors.text }]}>
                                                    Outstanding balance: <Text style={styles.dangerText}>₹{status.balance}</Text>
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.timelineActionsRow}>
                                            {isPaid ? (
                                                <>
                                                    <TouchableOpacity
                                                        id={`generate-receipt-${status.paymentId}`}
                                                        style={styles.printReceiptBtn}
                                                        onPress={() => setActiveReceiptPayment({ ...status, customerName: customer.name, phone: customer.phone, address: customer.address })}
                                                    >
                                                        <Printer size={12} color="#0284c7" />
                                                        <Text style={styles.printReceiptText}>Print Receipt</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        id={`delete-payment-${status.paymentId}`}
                                                        style={styles.deletePaymentBtn}
                                                        onPress={() => {
                                                            Alert.alert(
                                                                "Delete Payment Record",
                                                                "Delete this payment record? This will revert this month back to pending.",
                                                                [
                                                                    { text: "Cancel", style: "cancel" },
                                                                    { text: "Delete Record", style: "destructive", onPress: () => deletePayment(status.paymentId!) }
                                                                ]
                                                            );
                                                        }}
                                                    >
                                                        <Trash2 size={12} color={theme.colors.danger} />
                                                    </TouchableOpacity>
                                                </>
                                            ) : (
                                                customer.status === 'Active' && (
                                                    <TouchableOpacity
                                                        id={`pay-timeline-${status.month}`}
                                                        style={styles.collectTimelineBtn}
                                                        onPress={() => openPaymentEntry(customer.id, status.month)}
                                                    >
                                                        <Text style={styles.collectTimelineText}>Collect Dues</Text>
                                                    </TouchableOpacity>
                                                )
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Dynamic Receipt Modal Overlay */}
                <ReceiptModal
                profile={profile}
                    payment={activeReceiptPayment}
                    onClose={() => setActiveReceiptPayment(null)}
                />
            </ScrollView>
        );
    }

    // Section 3: Customer List Main Screen
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} id="customer-list-screen">
            <View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]} id="customers-board-section">
                <View style={styles.listHeaderRow}>
                    <View>
                        <Text style={[styles.listHeaderTitle, { color: currentColors.text }]}>Customer Records</Text>
                        <Text style={styles.listHeaderSubtitle}>Manage subscriptions & billing tracks</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addNewCustBtn}
                        onPress={openAddCustomer}
                        id="list-add-customer-btn"
                    >
                        <Plus size={16} color="#ffffff" />
                        <Text style={styles.addNewCustBtnText}>Add New</Text>
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={[styles.searchWrapper, { backgroundColor: currentColors.inputBg }]}>
                    <Search size={16} color={theme.colors.textLight} style={styles.searchIcon} />
                    <TextInput
                        id="list-search-input"
                        style={[styles.searchInput, { color: currentColors.text }]}
                        placeholder="Search by customer name, phone, newspaper..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                    {searchTerm ? (
                        <TouchableOpacity onPress={() => setSearchTerm('')}>
                            <Text style={styles.clearText}>Clear</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Multi Status filter row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillRow}>
                    {[
                        { id: 'All', label: 'All' },
                        { id: 'Active', label: 'Active' },
                        { id: 'Inactive', label: 'Inactive' },
                        { id: 'PendingDues', label: 'Pending Dues ⚠️' }
                    ].map((tab) => {
                        const isSelected = statusFilter === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.filterPill,
                                    { backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#334155' : '#f1f5f9') }
                                ]}
                                onPress={() => setStatusFilter(tab.id)}
                            >
                                <Text style={[styles.filterPillText, { color: isSelected ? '#ffffff' : currentColors.text }]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Sort Selectors */}
                <View style={styles.sortHeaderRow}>
                    <Text style={styles.sortLabel}>Sort By:</Text>
                    <View style={styles.sortActionContainer}>
                        {[
                            { id: 'name', label: 'Alphabet' },
                            { id: 'bill', label: 'Monthly Bill' },
                            { id: 'dues', label: 'Dues' }
                        ].map((item) => {
                            const active = sortBy === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => toggleSort(item.id as any)}
                                    style={styles.sortTriggerBtn}
                                    id={`sort-${item.id}-btn`}
                                >
                                    <Text style={[styles.sortTriggerText, { color: active ? '#0284c7' : '#94a3b8' }]}>
                                        {item.label}{active ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: currentColors.border }]} />

                {/* List of Customers */}
                <View style={styles.listContainer} id="customers-list-container">
                    <Text style={styles.listSectionTitle}>Customer List</Text>
                    {sortedList.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Info size={32} color={theme.colors.textMuted} />
                            <Text style={styles.emptyText}>No customers match current selection.</Text>
                        </View>
                    ) : (
                        sortedList.map(({ customer, totalOutstanding, pendingMonthsCount, lastPaymentDate }) => (
                            <View
                                key={customer.id}
                                style={[styles.customerListItem, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: currentColors.border }]}
                            >
                                <View style={styles.itemUpperRow}>
                                    <View style={styles.itemMetaLeft}>
                                        <View style={styles.itemNameAndStatus}>
                                            <TouchableOpacity onPress={() => viewCustomerDetails(customer.id)}>
                                                <Text style={[styles.itemCustomerName, { color: currentColors.text }]} numberOfLines={1}>
                                                    {customer.name}
                                                </Text>
                                            </TouchableOpacity>
                                            <View style={[styles.statusBadgeSmall, { backgroundColor: customer.status === 'Active' ? '#d1fae5' : '#cbd5e1' }]}>
                                                <Text style={[styles.statusBadgeSmallText, { color: customer.status === 'Active' ? '#047857' : '#475569' }]}>
                                                    {customer.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.itemSubtitleText}>
                                            {customer.newspaperName} (x{customer.newspapersCount}) • <Text style={styles.boldText}>₹{customer.monthlyBill}/mo</Text>
                                        </Text>

                                        {/* Metadata tags */}
                                        <View style={styles.metaBadgeRow}>
                                            <View style={styles.pinkBadge}>
                                                <Text style={styles.pinkBadgeText}>Last Collect: {lastPaymentDate}</Text>
                                            </View>
                                            <View style={[styles.dueBadge, { backgroundColor: totalOutstanding > 0 ? '#ffe4e6' : '#d1fae5' }]}>
                                                <Text style={[styles.dueBadgeText, { color: totalOutstanding > 0 ? '#be123c' : '#047857' }]}>
                                                    Due: ₹{totalOutstanding} {totalOutstanding > 0 ? `(${pendingMonthsCount}m)` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Actions buttons */}
                                    <View style={styles.itemActionGroup}>
                                        <TouchableOpacity
                                            style={styles.itemDetailsBtn}
                                            onPress={() => viewCustomerDetails(customer.id)}
                                            id={`view-details-btn-${customer.id}`}
                                        >
                                            <Text style={styles.itemDetailsBtnText}>Details</Text>
                                        </TouchableOpacity>

                                        {customer.status === 'Active' && totalOutstanding > 0 ? (
                                            <TouchableOpacity
                                                style={styles.whatsappIconBtn}
                                                onPress={() => sendWhatsAppReminder(customer, totalOutstanding)}
                                            >
                                                <MessageSquare size={14} color="#10b981" />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </View>

                                {/* Instant Record Dues Action */}
                                {customer.status === 'Active' && totalOutstanding > 0 ? (
                                    <TouchableOpacity
                                        style={styles.itemCollectBtn}
                                        onPress={() => handleQuickMarkPaid(customer)}
                                        id={`mark-paid-btn-${customer.id}`}
                                    >
                                        <Text style={styles.itemCollectBtnText}>Collect ₹{totalOutstanding}</Text>
                                    </TouchableOpacity>
                                ) : null}
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
    detailRowActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
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
    formInput: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 13,
        fontWeight: '600',
    },
    formTextArea: {
        height: 64,
        paddingTop: 8,
        textAlignVertical: 'top',
    },
    newspaperPillRow: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    newspaperPill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        marginRight: 6,
    },
    newspaperPillText: {
        fontSize: 11,
        fontWeight: '800',
    },
    statusToggleRow: {
        flexDirection: 'row',
        borderRadius: 12,
        overflow: 'hidden',
    },
    toggleBtnLeft: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 42,
    },
    toggleBtnRight: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 42,
    },
    toggleBtnText: {
        fontSize: 12,
        fontWeight: '800',
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveSubmitBtnText: {
        color: '#ffffff',
        fontSize: 12,
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
    profileCard: {
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    profileHeader: {
        marginBottom: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '900',
    },
    customerIdText: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '700',
    },
    profileName: {
        fontSize: 18,
        fontWeight: '900',
        marginTop: 6,
    },
    newspaperSubtitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    newspaperSubtitleText: {
        fontSize: 11,
        color: '#0284c7',
        fontWeight: '700',
    },
    profileActionsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    callProfileBtn: {
        flex: 1,
        backgroundColor: '#e0f2fe',
        height: 38,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    callProfileBtnText: {
        color: '#0284c7',
        fontSize: 11,
        fontWeight: '800',
    },
    waProfileBtn: {
        flex: 1,
        backgroundColor: '#d1fae5',
        height: 38,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    waProfileBtnText: {
        color: '#047857',
        fontSize: 11,
        fontWeight: '800',
    },
    detailDetailsSection: {
        borderTopWidth: 1,
        paddingTop: 16,
        gap: 12,
    },
    detailDetailsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    detailDetailsTextContainer: {
        flex: 1,
    },
    detailMetaLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    detailMetaValue: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },
    detailMetaSub: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 1,
        fontStyle: 'italic',
    },
    instructionsContainer: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#bae6fd',
        flexDirection: 'row',
        gap: 8,
    },
    instructionsIcon: {
        marginTop: 2,
    },
    instructionsLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#0369a1',
        textTransform: 'uppercase',
    },
    instructionsValue: {
        fontSize: 11,
        color: '#0c4a6e',
        fontWeight: '600',
        marginTop: 2,
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
    financeGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    financeCol: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
    },
    financeLabelText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#334155',
        textTransform: 'uppercase',
    },
    financeValueTextBig: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0f172a',
        marginTop: 4,
    },
    financeSubText: {
        fontSize: 9,
        color: '#475569',
        fontWeight: '700',
        marginTop: 2,
    },
    detailsRecordBtn: {
        backgroundColor: '#10b981',
        height: 44,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
    },
    detailsRecordBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '900',
    },
    timelineContainer: {
        gap: 16,
    },
    timelineRow: {
        flexDirection: 'row',
        gap: 10,
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 16,
        zIndex: 1,
    },
    timelineCard: {
        flex: 1,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timelineMonth: {
        fontSize: 11,
        fontWeight: '800',
    },
    timelineStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    timelineStatusText: {
        fontSize: 8,
        fontWeight: '900',
    },
    timelineBody: {
        marginTop: 8,
        gap: 2,
    },
    timelineBodyText: {
        fontSize: 11,
        fontWeight: '500',
    },
    boldText: {
        fontWeight: '800',
    },
    dangerText: {
        color: '#f43f5e',
        fontWeight: '800',
    },
    timelineRemarks: {
        fontSize: 9,
        color: '#64748b',
        fontStyle: 'italic',
    },
    timelineReceipt: {
        fontSize: 8,
        color: '#94a3b8',
        fontFamily: 'System',
        marginTop: 4,
    },
    timelineActionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 6,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
    },
    printReceiptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    printReceiptText: {
        color: '#0284c7',
        fontSize: 9,
        fontWeight: '800',
    },
    deletePaymentBtn: {
        backgroundColor: '#ffe4e6',
        padding: 4,
        borderRadius: 6,
    },
    collectTimelineBtn: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    collectTimelineText: {
        color: '#ffffff',
        fontSize: 9,
        fontWeight: '900',
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
    addNewCustBtn: {
        backgroundColor: '#0284c7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addNewCustBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '900',
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
    clearText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
    },
    filterPillRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    filterPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 6,
    },
    filterPillText: {
        fontSize: 10,
        fontWeight: '800',
    },
    sortHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    sortLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    sortActionContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    sortTriggerBtn: {
        paddingHorizontal: 4,
    },
    sortTriggerText: {
        fontSize: 10,
        fontWeight: '800',
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    listContainer: {},
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
    customerListItem: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    itemUpperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemMetaLeft: {
        flex: 1,
    },
    itemNameAndStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemCustomerName: {
        fontSize: 13,
        fontWeight: '800',
        maxWidth: 160,
    },
    statusBadgeSmall: {
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 4,
    },
    statusBadgeSmallText: {
        fontSize: 8,
        fontWeight: '900',
    },
    itemSubtitleText: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    metaBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    pinkBadge: {
        backgroundColor: '#fce7f3',
        borderColor: '#fbcfe8',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    pinkBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#9d174d',
    },
    dueBadge: {
        borderColor: '#cbd5e1',
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    dueBadgeText: {
        fontSize: 8,
        fontWeight: '900',
    },
    itemActionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    itemDetailsBtn: {
        backgroundColor: '#cbd5e1',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    itemDetailsBtnText: {
        color: '#1e293b',
        fontSize: 10,
        fontWeight: '800',
    },
    whatsappIconBtn: {
        width: 28,
        height: 28,
        backgroundColor: '#d1fae5',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemCollectBtn: {
        backgroundColor: '#0284c7',
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    itemCollectBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '900',
    },
});
