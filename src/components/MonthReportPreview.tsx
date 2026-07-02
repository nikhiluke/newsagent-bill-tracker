import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DistributorProfile {
  businessName?: string;
  phone?: string;
}

interface RowData {
  name?: string;
  phone?: string;
  newspaper?: string;
  monthlyBill?: number;
  periodBilled?: number;
  status?: string;
}

interface MonthSummary {
  targetAmount: number;
  collectedAmount: number;
  pendingAmount: number;
}

interface MonthlyReportViewProps {
  profile: DistributorProfile;
  rows: RowData[];
  monthSummary: MonthSummary;
  summaryMonth: string;
  summaryYear: string | number;
}

const getStatusStyle = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return { backgroundColor: '#ecfdf5', color: '#047857' };
  if (s === 'pending' || s === 'unpaid') return { backgroundColor: '#fef2f2', color: '#dc2626' };
  if (s === 'partial') return { backgroundColor: '#fffbeb', color: '#b45309' };
  return { backgroundColor: '#f1f5f9', color: '#475569' };
};

// Column flex ratios (mirrors the HTML table proportions)
const COL = {
  idx: 0.6,
  name: 1.8,
  phone: 1.4,
  newspaper: 1.4,
  rate: 1,
  bill: 1,
  status: 1.2,
};

export const MonthlyReportPreview: React.FC<MonthlyReportViewProps> = ({
  profile,
  rows,
  monthSummary,
  summaryMonth,
  summaryYear,
}) => {
  const businessName = profile?.businessName || 'Distributor';
  const phone = profile?.phone || 'N/A';
  const targetAmount = monthSummary?.targetAmount ?? 0;
  const collectedAmount = monthSummary?.collectedAmount ?? 0;
  const pendingAmount = monthSummary?.pendingAmount ?? 0;
  const safeRows = rows && rows.length > 0 ? rows : [];

  const generatedOn = new Date().toLocaleDateString();

  return (
    <View style={styles.reportContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.businessName}>{businessName.toUpperCase()}</Text>
        <Text style={styles.subtitle}>Distributor Report • Mob: {phone}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MONTHLY SUMMARY REPORT</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          <Text style={styles.metaBold}>Period: </Text>
          {summaryMonth} {summaryYear}
        </Text>
        <Text style={styles.metaText}>
          <Text style={styles.metaBold}>Generated on: </Text>
          {generatedOn}
        </Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Table head */}
        <View style={styles.theadRow}>
          <Text style={[styles.th, { flex: COL.idx }]}>No.</Text>
          <Text style={[styles.th, { flex: COL.name }]}>Customer</Text>
          <Text style={[styles.th, { flex: COL.phone }]}>Phone</Text>
          <Text style={[styles.th, { flex: COL.newspaper }]}>Newspaper</Text>
          <Text style={[styles.th, styles.thRight, { flex: COL.rate }]}>Rate</Text>
          <Text style={[styles.th, styles.thRight, { flex: COL.bill }]}>Bill</Text>
          <Text style={[styles.th, styles.thCenter, { flex: COL.status }]}>Status</Text>
        </View>

        {/* Table body */}
        {safeRows.length > 0 ? (
          safeRows.map((r, idx) => {
            const statusStyle = getStatusStyle(r.status || '');
            return (
              <View style={styles.tr} key={idx}>
                <Text style={[styles.cell, styles.cellIdx, { flex: COL.idx }]}>{idx + 1}</Text>
                <Text style={[styles.cell, styles.cellName, { flex: COL.name }]} numberOfLines={1}>
                  {r.name || 'N/A'}
                </Text>
                <Text style={[styles.cell, { flex: COL.phone }]} numberOfLines={1}>
                  {r.phone || 'N/A'}
                </Text>
                <Text style={[styles.cell, { flex: COL.newspaper }]} numberOfLines={1}>
                  {r.newspaper || 'N/A'}
                </Text>
                <Text style={[styles.cell, styles.cellRight, { flex: COL.rate }]}>
                  ₹{r.monthlyBill ?? 0}
                </Text>
                <Text style={[styles.cell, styles.cellRight, { flex: COL.bill }]}>
                  ₹{r.periodBilled ?? 0}
                </Text>
                <View style={[styles.cellCenterWrap, { flex: COL.status }]}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.color }]}>
                      {(r.status || 'N/A').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No records found for this period.</Text>
          </View>
        )}
      </View>

      {/* Summary box */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>TOTAL EXPECTED</Text>
          <Text style={[styles.summaryValue, styles.valueTarget]}>₹{targetAmount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>TOTAL RECEIVED</Text>
          <Text style={[styles.summaryValue, styles.valueCollected]}>₹{collectedAmount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>TOTAL OUTSTANDING</Text>
          <Text style={[styles.summaryValue, styles.valuePending]}>₹{pendingAmount}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Computer generated report • {safeRows.length} customer{safeRows.length !== 1 ? 's' : ''} listed
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  reportContainer: {
    width: 800,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 30,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    // approximate box-shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  // Header
  header: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
    marginBottom: 20,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    color: '#0f172a',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#eff6ff',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 9999,
  },
  badgeText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  metaBold: {
    fontWeight: '700',
  },

  // Table
  table: {
    marginBottom: 20,
  },
  theadRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  th: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  thRight: {
    textAlign: 'right',
  },
  thCenter: {
    textAlign: 'center',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  cell: {
    fontSize: 12,
    color: '#334155',
    paddingHorizontal: 4,
  },
  cellIdx: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  cellName: {
    fontWeight: '700',
    color: '#0f172a',
  },
  cellRight: {
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  cellCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
  },

  // Summary box
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  valueTarget: {
    color: '#0f172a',
  },
  valueCollected: {
    color: '#10b981',
  },
  valuePending: {
    color: '#ef4444',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 10,
    color: '#94a3b8',
  },
});

export default MonthlyReportPreview;