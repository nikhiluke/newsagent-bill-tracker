import React, { useState } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	Platform,
	Alert
} from 'react-native';
import { useAppState } from '../hooks/useAppState';
import { calculateCustomerOutstanding, getCustomerStatusForMonth, getActiveMonthsForCustomer, getCurrentMonth, getCurrentYear, getActiveCustomer } from '../utility';
import {
	FileSpreadsheet, Download, RefreshCw, CheckCircle,
	TrendingUp, Info, Calendar, Target, Clock, Clipboard,
	Share,
	Cross,
	CrossIcon,
	FileWarning,
	InfoIcon,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { theme } from '../theme';
import MonthYearPicker from '../components/MonthYearPicker';
import { MONTHS } from '../data';
import { generateMonthlyReportHTML } from '../utility/reports';
import MonthlyReportPreview from '../components/MonthReportPreview';

export default function SummaryScreen() {
	const { customers, payments, settings, profile } = useAppState();

	const currentMonth = getCurrentMonth();
	const currentYear = getCurrentYear()

	const MONTH_LIST = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	// State for Billing Month Summary
	const [summaryMonth, setSummaryMonth] = useState<string>(currentMonth);
	const [summaryYear, setSummaryYear] = useState<number>(currentYear);

	// State for Billing Yearly Summary
	const [summaryYearForYearly, setSummaryYearForYearly] = useState<number>(currentYear);
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

	// Calculations for Billing Month Summary
	const getMonthSummaryStats = (month: string, year: number) => {
		let targetAmount = 0;
		let collectedAmount = 0;
		let pendingAmount = 0;

		const activeCustomers = getActiveCustomer(customers, month, year);

		activeCustomers.forEach(c => {
			const activeMonths = getActiveMonthsForCustomer(c, year);
			if (activeMonths.includes(month)) {
				const status = getCustomerStatusForMonth(c, month, year, payments);
				targetAmount += status.finalAmount;
				collectedAmount += status.paidAmount;
				pendingAmount += status.balance;
			}
		});

		return { targetAmount, collectedAmount, pendingAmount };
	};

	// Calculations for Billing Yearly Summary
	const getYearSummaryStats = (year: number) => {
		let targetAmount = 0;
		let collectedAmount = 0;
		let pendingAmount = 0;

		const activeCustomers = customers.filter(c => c.status === 'Active');

		activeCustomers.forEach(c => {
			const activeMonths = getActiveMonthsForCustomer(c, year);
			activeMonths.forEach(m => {
				const status = getCustomerStatusForMonth(c, m, year, payments);
				targetAmount += status.finalAmount;
				collectedAmount += status.paidAmount;
				pendingAmount += status.balance;
			});
		});

		return { targetAmount, collectedAmount, pendingAmount };
	};

	const monthSummary = getMonthSummaryStats(summaryMonth, summaryYear);
	const yearSummary = getYearSummaryStats(summaryYearForYearly);

	const [exportPeriod, setExportPeriod] = useState<'month' | 'year'>('month');
	const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel' | 'CSV'>('PDF');
	const [exportingType, setExportingType] = useState<string | null>(null);
	const [successToast, setSuccessToast] = useState<string | null>(null);
	const [errorToast, setErrorToast] = useState<string | null>(null);
	const [monthReportRow, setMonthReportRow] = useState<any[]>([]);
	const isDisabledGenerateReport = ((currentYear * 12 + MONTHS.indexOf(currentMonth)) < (summaryYear * 12 + MONTHS.indexOf(summaryMonth)))

	// Compile rows for report
	const getReportRows = (period: 'month' | 'year'): any[] => {
		const activeCustomers = getActiveCustomer(customers, summaryMonth, summaryYear);
		return activeCustomers.map(c => {
			const { totalOutstanding } = calculateCustomerOutstanding(c, payments);

			if (period === 'month') {
				const status = getCustomerStatusForMonth(c, summaryMonth, summaryYear, payments);
				return {
					name: c.name,
					phone: c.phone,
					address: c.address,
					newspaper: c.newspaperName,
					monthlyBill: c.monthlyBill,
					periodBilled: status.finalAmount,
					periodPaid: status.paidAmount,
					status: status.status === 'Paid' ? 'Paid' : 'Unpaid',
					finalBalance: totalOutstanding
				};
			} else {
				const months = [...MONTH_LIST.slice(0, MONTH_LIST.indexOf(currentMonth) + 1)];
				const monthlyDetails: { [key: string]: { amount: number; paidAmount: number; balance: number; status: 'Paid' | 'Unpaid' | '-' } } = {};

				months.forEach(m => {
					const activeMonths = getActiveMonthsForCustomer(c, currentYear);
					if (activeMonths.includes(m)) {
						const status = getCustomerStatusForMonth(c, m, currentYear, payments);
						monthlyDetails[m] = {
							amount: status.finalAmount,
							paidAmount: status.paidAmount,
							balance: status.balance,
							status: status.status === 'Paid' ? 'Paid' : 'Unpaid'
						};
					} else {
						monthlyDetails[m] = {
							amount: 0,
							paidAmount: 0,
							balance: 0,
							status: '-'
						};
					}
				});

				return {
					name: c.name,
					phone: c.phone,
					address: c.address,
					newspaper: c.newspaperName,
					monthlyBill: c.monthlyBill,
					monthlyDetails,
					finalBalance: totalOutstanding
				};
			}
		});
	};

	// todo - next release
	// const executeExport = () => {
	// 	setExportingType(exportFormat);

	// 	setTimeout(() => {
	// 		setExportingType(null);

	// 		let reportString = '';
	// 		if (exportPeriod === 'month') {
	// 			const rows = getReportRows('month');
	// 			reportString += `${profile.businessName} - ${summaryMonth} ${summaryYear} Monthly Report\n`;
	// 			reportString += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
	// 			reportString += `No. | Customer | Phone | Newspaper | Rate | Bill | Status\n`;

	// 			rows.forEach((r, idx) => {
	// 				reportString += `${idx + 1}. | ${r.name} | ${r.phone} | ${r.newspaper} | ₹${r.monthlyBill} | ₹${r.periodBilled} | ${r.status}\n`;
	// 			});

	// 			reportString += `\nTotal expected: ₹${monthSummary.targetAmount}\n`;
	// 			reportString += `Total received: ₹${monthSummary.collectedAmount}\n`;
	// 			reportString += `Total outstanding: ₹${monthSummary.pendingAmount}\n`;
	// 		} else {
	// 			const rows = getReportRows('year');
	// 			reportString += `${profile.businessName} - Year ${currentYear} Distribution Report\n`;
	// 			reportString += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
	// 			reportString += `No. | Customer | Phone | Newspaper | Rate | Cumulative Outstanding\n`;

	// 			rows.forEach((r, idx) => {
	// 				reportString += `${idx + 1}. | ${r.name} | ${r.phone} | ${r.newspaper} | ₹${r.monthlyBill} | ₹${r.finalBalance}\n`;
	// 			});

	// 			reportString += `\nYear-To-Date target: ₹${yearSummary.targetAmount}\n`;
	// 			reportString += `Year-To-Date collected: ₹${yearSummary.collectedAmount}\n`;
	// 			reportString += `Year-To-Date outstanding: ₹${yearSummary.pendingAmount}\n`;
	// 		}

	// 		setCopiedReportData(reportString);
	// 		setSuccessToast(`Compiled report for ${exportPeriod === 'month' ? `${currentMonth} ${currentYear}` : `Year ${currentYear}`}! See preview below.`);
	// 		Alert.alert(
	// 			"Report Compiled",
	// 			`Report generated successfully as ${exportFormat}! The data preview is loaded below. You can copy or share it directly from your device.`,
	// 			[{ text: "Great" }]
	// 		);
	// 	}, 1200);
	// };

	const executeExport = async () => {
		const rows = getReportRows('month');
		setMonthReportRow(rows);
		if (rows.length > 0) {
			setSuccessToast(`Compiled report for ${summaryMonth} ${summaryYear}! See preview below.`);
		} else {
			setErrorToast(`No active customers found for ${summaryMonth} ${summaryYear}.`);
		}
	};

	const executeShareReport = async () => {
		setIsGeneratingPdf(true);
		try {
			const htmlContent = generateMonthlyReportHTML(profile, monthReportRow, monthSummary, summaryMonth, summaryYear);

			// Generate PDF File
			const { uri } = await Print.printToFileAsync({
				html: htmlContent
			});
			const sourceFile = new File(uri);
			const destFile = new File(Paths.cache, `Report_${currentMonth}_${currentYear}_${profile.businessName}.pdf`);

			// remove if a file with same name already exists, then copy
			if (destFile.exists) {
				destFile.delete();
			}
			sourceFile.copy(destFile);

			// Launch native sharing container
			if (await Sharing.isAvailableAsync()) {
				await Sharing.shareAsync(destFile.uri, {
					mimeType: 'application/pdf',
					dialogTitle: `${profile.businessName} - ${summaryMonth} ${summaryYear} Monthly Report`,
					UTI: 'com.adobe.pdf',
				});
			} else {
				Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this device.');
			}
		} catch (error) {
			console.error('PDF Generation Failure:', error);
			Alert.alert('Error', 'Could not generate and share PDF Receipt.');
		} finally {
			setIsGeneratingPdf(false);
		}
	}


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
		<ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" id="reports-tab-root">

			{/* Monthly Statistics aggregates card */}
			<View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]} id="billing-month-summary-container">
				<View style={styles.cardHeaderRow}>
					<View>
						<Text style={[styles.cardTitle, { color: currentColors.text }]}>Billing Month Summary</Text>
						<Text style={styles.cardSubtitle}>Expected, collected & pending dues</Text>
					</View>

					{/* <View style={styles.selectorsRow}>
						<TouchableOpacity style={[styles.inlinePill, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
							<Text style={[styles.inlinePillText, { color: currentColors.text }]}>{summaryMonth}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.inlinePill, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
							<Text style={[styles.inlinePillText, { color: currentColors.text }]}>{summaryYear}</Text>
						</TouchableOpacity>
					</View> */}
				</View>

				<View style={{ marginTop: 0, marginBottom: 10 }}>
					<MonthYearPicker
						selectedMonth={summaryMonth}
						selectedYear={summaryYear}
						onMonthChange={setSummaryMonth}
						onYearChange={setSummaryYear}
						isDark={isDark}
						years={[currentYear, currentYear + 1, currentYear + 2]}
						showLabels={false}
					/>
				</View>

				<View style={styles.financeGrid}>
					<View style={[styles.financeCol, { backgroundColor: '#eff6ff' }]}>
						<View style={styles.colHeaderIconRow}>
							<Text style={styles.financeLabelText}>Target</Text>
							<Target size={14} color="#0284c7" />
						</View>
						<Text style={styles.financeVal}>₹{monthSummary.targetAmount.toLocaleString('en-IN')}</Text>
						<Text style={styles.financeSub}>Expected bills</Text>
					</View>

					<View style={[styles.financeCol, { backgroundColor: '#ecfdf5' }]}>
						<View style={styles.colHeaderIconRow}>
							<Text style={[styles.financeLabelText, { color: '#047857' }]}>Collected</Text>
							<CheckCircle size={14} color="#10b981" />
						</View>
						<Text style={[styles.financeVal, { color: '#047857' }]}>₹{monthSummary.collectedAmount.toLocaleString('en-IN')}</Text>
						<Text style={styles.financeSub}>Paid payments</Text>
					</View>

					<View style={[styles.financeCol, { backgroundColor: '#fff5f5' }]}>
						<View style={styles.colHeaderIconRow}>
							<Text style={[styles.financeLabelText, { color: '#be123c' }]}>Pending</Text>
							<Clock size={14} color="#f43f5e" />
						</View>
						<Text style={[styles.financeVal, { color: '#be123c' }]}>₹{monthSummary.pendingAmount.toLocaleString('en-IN')}</Text>
						<Text style={styles.financeSub}>Unpaid dues</Text>
					</View>
				</View>
			</View>


			{/* todo-next release Yearly Statistics aggregate card */}
			{/* 
			<View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]} id="billing-yearly-summary-container">
				<View style={styles.cardHeaderRow}>
					<View>
						<Text style={[styles.cardTitle, { color: currentColors.text }]}>Billing Yearly Summary</Text>
						<Text style={styles.cardSubtitle}>Cumulative distribution & targets YTD</Text>
					</View>

					{/* <TouchableOpacity style={[styles.inlinePill, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
						<Text style={[styles.inlinePillText, { color: currentColors.text }]}>{summaryYearForYearly}</Text>
					</TouchableOpacity>
				</View>

				<View style={{ marginTop: 0, marginBottom: 10 }}>
					<MonthYearPicker
						selectedMonth={summaryMonth}
						selectedYear={summaryYear}
						onMonthChange={setSummaryMonth}
						onYearChange={setSummaryYear}
						isDark={isDark}
						years={[currentYear, currentYear + 1, currentYear + 2]}
						showLabels={false}
						onlyShow='year'
					/>
				</View>

				<View style={styles.financeGrid}>
					<View style={[styles.financeCol, { backgroundColor: '#f5f3ff' }]}>
						<View style={styles.colHeaderIconRow}>
							<Text style={[styles.financeLabelText, { color: '#6d28d9' }]}>Target YTD</Text>
							<Target size={14} color="#6d28d9" />
						</View>
						<Text style={[styles.financeVal, { color: '#6d28d9' }]}>₹{yearSummary.targetAmount.toLocaleString('en-IN')}</Text>
						<Text style={styles.financeSub}>Expected targets</Text>
					</View>

					<View style={[styles.financeCol, { backgroundColor: '#ecfdf5' }]}>
						<View style={styles.colHeaderIconRow}>
							<Text style={[styles.financeLabelText, { color: '#047857' }]}>Collected YTD</Text>
							<CheckCircle size={14} color="#10b981" />
						</View>
						<Text style={[styles.financeVal, { color: '#047857' }]}>₹{yearSummary.collectedAmount.toLocaleString('en-IN')}</Text>
						<Text style={styles.financeSub}>Total collected</Text>
					</View>

					<View style={[styles.financeCol, { backgroundColor: '#fff5f5' }]}>
						<View style={styles.colHeaderIconRow}>
							<Text style={[styles.financeLabelText, { color: '#be123c' }]}>Pending YTD</Text>
							<Clock size={14} color="#f43f5e" />
						</View>
						<Text style={[styles.financeVal, { color: '#be123c' }]}>₹{yearSummary.pendingAmount.toLocaleString('en-IN')}</Text>
						<Text style={styles.financeSub}>Total outstanding</Text>
					</View>
				</View>
			</View> */}

			{/* Main Reports Configuration & compilation section */}
			<View style={[styles.card, { backgroundColor: currentColors.card, borderColor: currentColors.border }]} id="unified-export-container">
				<View style={styles.reportsHeader}>
					<FileSpreadsheet size={20} color="#0284c7" />
					<View>
						<Text style={[styles.reportsTitle, { color: currentColors.text }]}>Export Business Analytics</Text>
						<Text style={styles.reportsSubtitle}>Generate audited files for accounting and delivery schedules</Text>
					</View>
				</View>

				{/* Format Selector Row , todo-next release choose 'Excel', 'CSV'*/}
				<View style={styles.sectionFormGroup}>
					<Text style={[styles.reportsGroupLabel, { color: currentColors.textLight }]}>Format</Text>
					<View style={styles.formatGrid}>
						{['PDF'].map((format) => {
							const active = exportFormat === format;
							return (
								<TouchableOpacity
									key={format}
									style={[
										styles.formatBtn,
										{ backgroundColor: active ? '#0284c7' : (isDark ? '#334155' : '#f1f5f9'), borderColor: active ? '#0284c7' : currentColors.border },
										isDisabledGenerateReport && { backgroundColor: '#94a3b8' }
									]}
									onPress={() => setExportFormat(format as any)}
								>
									<Text style={[styles.formatBtnText, { color: active ? '#ffffff' : currentColors.text }]}>{format}</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>

				{/* Scope Selector Row */}
				<View style={styles.sectionFormGroup}>
					<Text style={[styles.reportsGroupLabel, { color: currentColors.textLight }]}>Choose Report Period Scope</Text>
					<View style={styles.scopeGrid}>
						<TouchableOpacity
							style={[
								styles.scopeCard,
								{ backgroundColor: exportPeriod === 'month' ? '#f0f9ff' : (isDark ? '#1e293b' : '#ffffff'), borderColor: exportPeriod === 'month' ? '#0284c7' : currentColors.border },
								isDisabledGenerateReport && { backgroundColor: '#94a3b8' }
							]}
							onPress={() => setExportPeriod('month')}
						>
							<Calendar size={20} color={exportPeriod === 'month' ? '#0284c7' : '#94a3b8'} style={styles.scopeIcon} />
							<View>
								<Text style={[styles.scopeTitle, { color: currentColors.text }]}>Current Month</Text>
								<Text style={styles.scopeDesc}>{`${currentMonth} ${currentYear}`} status & bills only</Text>
							</View>
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.scopeCard,
								{ backgroundColor: exportPeriod === 'year' ? '#f0f9ff' : (isDark ? '#1e293b' : '#ffffff'), borderColor: exportPeriod === 'year' ? '#0284c7' : currentColors.border }
							]}
							onPress={() => setExportPeriod('year')}
							disabled={true}
						>
							<TrendingUp size={20} color={exportPeriod === 'year' ? '#0284c7' : '#94a3b8'} style={styles.scopeIcon} />
							<View>
								<Text style={[styles.scopeTitle, { color: 'red' }]}>Coming Soon</Text>
								<Text style={[styles.scopeTitle, { color: currentColors.text }]}>Cumulative Year</Text>
								<Text style={styles.scopeDesc}>{`Jan - ${currentMonth} ${currentYear}`} audited history</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>

				{/* Generate Trigger Button */}
				<TouchableOpacity
					style={[styles.generateBtn, isDisabledGenerateReport && { backgroundColor: '#94a3b8' }]}
					onPress={executeExport}
					id="compile-report-btn"
					disabled={isDisabledGenerateReport}
				>
					{exportingType ? (
						<RefreshCw size={16} color="#ffffff" style={styles.spinIcon} />
					) : (
						<Download size={16} color="#ffffff" />
					)}
					<Text style={styles.generateBtnText}>
						{exportingType ? 'Compiling Ledger Database...' : `Generate & Preview ${exportPeriod === 'month' ? `${summaryMonth} ${summaryYear}` : `${`Jan - ${currentMonth} ${currentYear}`} audited history`} Report`}
					</Text>
				</TouchableOpacity>

				{/* Toast message notifications */}
				{successToast ? (
					<View style={styles.successToast} id="export-toast-notification">
						<CheckCircle size={18} color="#10b981" />
						<View style={styles.toastTextContainer}>
							<Text style={styles.toastTitle}>Report Generation Completed</Text>
							<Text style={styles.toastSub}>{successToast}</Text>
						</View>
					</View>
				) : null}

				{/* Toast message notifications */}
				{errorToast ? (
					<View style={{ ...styles.successToast, backgroundColor: '#fef2f2', borderColor: '#be123c' }} id="export-toast-notification">
						<InfoIcon color='#be123c' size={18} />
						<View style={styles.toastTextContainer}>
							<Text style={[styles.toastTitle, { color: '#be123dff' }]}>Error In Report Generation</Text>
							<Text style={[styles.toastSub, { color: '#be123c' }]}>{errorToast}</Text>
						</View>
					</View>
				) : null}

				{/* Real-time generated text block with copying option for true native experience */}
				{monthReportRow.length > 0 ? (
					<View style={[styles.reportPreviewCard, { backgroundColor: isDark ? '#111827' : '#f8fafc', borderColor: currentColors.border }]}>
						<View style={styles.previewHeader}>
							<Text style={styles.previewTitle}>Generated Report Preview</Text>
							<Text style={styles.previewMeta}>Ready to share</Text>
						</View>

						<ScrollView style={styles.textPreviewArea} nestedScrollEnabled horizontal>
							<MonthlyReportPreview
								profile={profile}
								rows={monthReportRow}
								monthSummary={monthSummary}
								summaryMonth={summaryMonth}
								summaryYear={summaryYear} />
						</ScrollView>

						<View style={styles.previewFooterRow}>
							<TouchableOpacity
								style={styles.shareReportBtn}
								onPress={executeShareReport}
								disabled={isGeneratingPdf || monthReportRow.length === 0}
							>
								{isGeneratingPdf ? (
									<RefreshCw size={18} color="#ffffff" style={styles.spinIcon} />
								) : (
									<Share size={18} color="#0284c7" />
								)}
								<Text style={styles.shareReportBtnText}>Share Report</Text>
							</TouchableOpacity>
						</View>
					</View>
				) : (
					<View style={styles.pendingPreviewCard}>
						<Info size={16} color="#94a3b8" />
						<Text style={styles.pendingPreviewText}>Report has not been compiled yet. Choose a format and tap the compile button above to run distribution analytics.</Text>
					</View>
				)}

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
	successToast: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		backgroundColor: '#ecfdf5',
		borderWidth: 1,
		borderColor: '#a7f3d0',
		borderRadius: 16,
		padding: 12,
		gap: 10,
	},
	toastTextContainer: {
		flex: 1,
	},
	toastTitle: {
		fontSize: 11,
		fontWeight: '900',
		color: '#047857',
	},
	toastSub: {
		fontSize: 9,
		color: '#34d399',
		fontWeight: '700',
		marginTop: 2,
	},
	card: {
		borderRadius: 24,
		padding: 16,
		borderWidth: 1,
	},
	cardHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 13,
		fontWeight: '900',
	},
	cardSubtitle: {
		fontSize: 9,
		color: '#94a3b8',
		marginTop: 2,
		fontWeight: '700',
	},
	selectorsRow: {
		flexDirection: 'row',
		gap: 6,
	},
	inlinePill: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 8,
	},
	inlinePillText: {
		fontSize: 9,
		fontWeight: '900',
	},
	financeGrid: {
		flexDirection: 'row',
		gap: 10,
	},
	financeCol: {
		flex: 1,
		borderRadius: 16,
		padding: 12,
		gap: 4,
	},
	colHeaderIconRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	financeLabelText: {
		fontSize: 8,
		fontWeight: '800',
		color: '#0284c7',
		textTransform: 'uppercase',
	},
	financeVal: {
		fontSize: 14,
		fontWeight: '900',
		color: '#0f172a',
		fontFamily: 'System',
	},
	financeSub: {
		fontSize: 8,
		color: '#64748b',
		fontWeight: '700',
	},
	reportsHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#f1f5f9',
		paddingBottom: 12,
		marginBottom: 16,
	},
	reportsTitle: {
		fontSize: 15,
		fontWeight: '900',
	},
	reportsSubtitle: {
		fontSize: 10,
		color: '#94a3b8',
		marginTop: 2,
		fontWeight: '700',
		maxWidth: 240,
	},
	sectionFormGroup: {
		gap: 8,
		marginBottom: 16,
	},
	reportsGroupLabel: {
		fontSize: 10,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	formatGrid: {
		flexDirection: 'row',
		gap: 8,
	},
	formatBtn: {
		flex: 1,
		height: 40,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
	},
	formatBtnText: {
		fontSize: 11,
		fontWeight: '900',
	},
	scopeGrid: {
		flexDirection: 'row',
		gap: 10,
	},
	scopeCard: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 16,
		padding: 12,
		minHeight: 110,
		justifyContent: 'space-between',
	},
	scopeIcon: {
		marginBottom: 8,
	},
	scopeTitle: {
		fontSize: 11,
		fontWeight: '800',
	},
	scopeDesc: {
		fontSize: 8,
		color: '#94a3b8',
		fontWeight: '700',
		marginTop: 2,
	},
	generateBtn: {
		backgroundColor: '#0284c7',
		height: 46,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: 8,
		marginBottom: 16,
	},
	generateBtnText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: '900',
	},
	spinIcon: {
		// animated styling in react native is handled via keyframes, we just display it statically here
	},
	reportPreviewCard: {
		borderWidth: 1,
		borderRadius: 16,
		padding: 12,
		gap: 10,
	},
	previewHeader: {
		borderBottomWidth: 1,
		borderBottomColor: '#cbd5e1',
		paddingBottom: 8,
	},
	previewTitle: {
		fontSize: 10,
		fontWeight: '900',
		color: '#64748b',
		textTransform: 'uppercase',
	},
	previewMeta: {
		fontSize: 8,
		color: '#94a3b8',
		fontWeight: '700',
		marginTop: 1,
	},
	textPreviewArea: {
		maxHeight: 400,
		maxWidth: 500
	},
	textReport: {
		fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
		fontSize: 10,
		lineHeight: 14,
		fontWeight: '600',
	},
	previewFooterRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		borderTopWidth: 1,
		borderTopColor: '#cbd5e1',
		paddingTop: 8,
	},
	shareReportBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		backgroundColor: '#e0f2fe',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		width: 200,
		height: 40,
	},
	shareReportBtnText: {
		color: '#0284c7',
		fontSize: 12,
		fontWeight: '900',
	},
	pendingPreviewCard: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		paddingHorizontal: 12,
		backgroundColor: '#f1f5f9',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#e2e8f0',
		gap: 6,
	},
	pendingPreviewText: {
		fontSize: 9,
		color: '#94a3b8',
		fontWeight: '600',
		textAlign: 'center',
		lineHeight: 12,
	},
});
